/**
 * x402 Payment Tool - x402 protocol payment handling
 * Signs EIP-3009 authorizations for 402 payment flow
 */

import { createWalletClient, http } from 'viem';
import type { Address, Hash, Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celoAlfajores } from 'viem/chains';
import { z } from 'zod';

// CELO token address on Alfajores
const CELO_TOKEN_ADDRESS = '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9' as Address;

// EIP-3009 transfer authorization types
const EIP3009_TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
} as const;

// x402 payment input schema
export const PaymentInputSchema = z.object({
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid recipient address'),
  amount: z.string().min(1, 'Amount must be positive'),
  description: z.string().optional(),
  validAfter: z.number().optional(),
  validBefore: z.number().optional(),
});

export type PaymentInput = z.infer<typeof PaymentInputSchema>;

// Payment result
export interface PaymentResult {
  success: boolean;
  authorization?: {
    from: Address;
    to: Address;
    value: bigint;
    validAfter: bigint;
    validBefore: bigint;
    nonce: Hex;
    v: number;
    r: Hex;
    s: Hex;
    signature: Hex;
  };
  transactionHash?: Hash;
  error?: string;
}

// x402 response type
export interface X402Response {
  status: 'success' | 'payment_required' | 'failed';
  paymentRequired?: {
    recipient: Address;
    amount: string;
    description?: string;
  };
  authorization?: PaymentResult['authorization'];
  data?: unknown;
  error?: string;
}

/**
 * Generate a random nonce for EIP-3009
 */
function generateNonce(): Hex {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}` as Hex;
}

/**
 * x402 Payment Tool for handling 402 payment flow
 */
export class PaymentTool {
  private walletClient: ReturnType<typeof createWalletClient> | null = null;
  private account: ReturnType<typeof privateKeyToAccount> | null = null;
  private chain = celoAlfajores;

  setWallet(privateKey: `0x${string}`): void {
    this.account = privateKeyToAccount(privateKey);
    this.walletClient = createWalletClient({
      account: this.account,
      chain: this.chain,
      transport: http(),
    });
  }

  hasWallet(): boolean {
    return this.walletClient !== null && this.account !== null;
  }

  getAddress(): Address | null {
    return this.account?.address || null;
  }

  async createAuthorization(input: PaymentInput): Promise<PaymentResult> {
    if (!this.hasWallet() || !this.account) {
      return { success: false, error: 'Wallet not configured. Call setWallet() first.' };
    }

    try {
      const validated = PaymentInputSchema.parse(input);
      const value = BigInt(Math.floor(parseFloat(validated.amount) * 1e18));
      const now = Math.floor(Date.now() / 1000);
      const validAfter = BigInt(validated.validAfter || now);
      const validBefore = BigInt(validated.validBefore || now + 3600);
      const nonce = generateNonce();
      const recipient = validated.recipient as Address;

      const domain = {
        name: 'Celo Dollar',
        version: '1',
        chainId: this.chain.id,
        verifyingContract: CELO_TOKEN_ADDRESS,
      };

      const message = { from: this.account.address, to: recipient, value, validAfter, validBefore, nonce };

      const signature = await this.account.signTypedData({
        domain, types: EIP3009_TYPES, primaryType: 'TransferWithAuthorization', message,
      });

      const sig = signature.slice(2);
      const r = `0x${sig.slice(0, 64)}` as Hex;
      const s = `0x${sig.slice(64, 128)}` as Hex;
      const v = parseInt(sig.slice(128, 130), 16);

      return { success: true, authorization: { from: this.account.address, to: recipient, value, validAfter, validBefore, nonce, v, r, s, signature } };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async handleX402Payment(response: Response): Promise<X402Response> {
    if (response.status !== 402) {
      try { return { status: 'success', data: await response.json() }; } catch { return { status: 'failed', error: 'Failed to parse response' }; }
    }

    let paymentData: { recipient: string; amount: string; description?: string };
    try { paymentData = await response.json() as { recipient: string; amount: string; description?: string }; } catch { return { status: 'failed', error: 'Failed to parse 402 payment data' }; }

    if (!this.hasWallet()) {
      return { status: 'payment_required', paymentRequired: { recipient: paymentData.recipient as Address, amount: paymentData.amount, description: paymentData.description }, error: 'Wallet not configured' };
    }

    const authResult = await this.createAuthorization({ recipient: paymentData.recipient, amount: paymentData.amount, description: paymentData.description });
    if (!authResult.success || !authResult.authorization) {
      return { status: 'failed', paymentRequired: { recipient: paymentData.recipient as Address, amount: paymentData.amount }, error: authResult.error };
    }

    return { status: 'payment_required', paymentRequired: { recipient: paymentData.recipient as Address, amount: paymentData.amount }, authorization: authResult.authorization };
  }

  async verifyAuthorization(authorization: PaymentResult['authorization']): Promise<boolean> {
    if (!authorization) return false;
    try {
      const { validAfter, validBefore, v } = authorization;
      const now = BigInt(Math.floor(Date.now() / 1000));
      if (now < validAfter || now > validBefore) return false;
      if (v < 27 || v > 28) return false;
      return true;
    } catch { return false; }
  }
}

export default PaymentTool;

export const paymentToolDefinition = {
  type: 'function' as const,
  function: {
    name: 'handle_payment',
    description: 'Create an EIP-3009 transfer authorization for x402 payment flow.',
    parameters: {
      type: 'object',
      properties: {
        recipient: { type: 'string', description: 'The Ethereum address of the payment recipient (0x...)' },
        amount: { type: 'string', description: 'Amount to pay in CELO (not wei)' },
        description: { type: 'string', description: 'Optional description of the payment' },
        validAfter: { type: 'number', description: 'Unix timestamp when authorization becomes valid' },
        validBefore: { type: 'number', description: 'Unix timestamp when authorization expires' },
      },
      required: ['recipient', 'amount'],
    },
  },
};
