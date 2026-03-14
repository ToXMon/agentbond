/**
 * Vouching Tool - Contract interaction for vouching
 * Uses viem to call ReputationStaking contract
 */

import { createWalletClient, createPublicClient, http, parseEther } from 'viem';
import type { Address, Hash, Account } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celoAlfajores } from 'viem/chains';
import { z } from 'zod';
import { REPUTATION_STAKING_ABI } from '../contracts/abis/ReputationStaking.js';

// Vouch input schema
export const VouchInputSchema = z.object({
  targetAgent: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  stakeAmount: z.string().min(1, 'Stake amount must be positive'),
  cooldownPeriod: z.number().int().positive().default(86400),
});

export type VouchInput = z.infer<typeof VouchInputSchema>;

// Vouch result
export interface VouchResult {
  success: boolean;
  transactionHash?: Hash;
  stakeAmount?: string;
  targetAgent?: Address;
  error?: string;
}

// Default contract address on Celo Alfajores
const DEFAULT_STAKING_CONTRACT = '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63' as Address;

export class VouchTool {
  private contractAddress: Address;
  private walletClient: ReturnType<typeof createWalletClient> | null = null;
  private publicClient: ReturnType<typeof createPublicClient> | null = null;
  private account: Account | null = null;
  private chain = celoAlfajores;

  constructor(contractAddress: Address = DEFAULT_STAKING_CONTRACT) {
    this.contractAddress = contractAddress;
    this.publicClient = createPublicClient({ chain: this.chain, transport: http() }) as ReturnType<typeof createPublicClient>;
  }

  setWallet(privateKey: `0x${string}`): void {
    this.account = privateKeyToAccount(privateKey);
    this.walletClient = createWalletClient({
      account: this.account,
      chain: this.chain,
      transport: http(),
    });
  }

  setContractAddress(address: Address): void {
    this.contractAddress = address;
  }

  async vouchForAgent(input: VouchInput): Promise<VouchResult> {
    const validated = VouchInputSchema.parse(input);
    if (!this.walletClient || !this.account) {
      return { success: false, error: 'Wallet not configured. Call setWallet() first.' };
    }
    try {
      const stakeAmountWei = parseEther(validated.stakeAmount);
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: REPUTATION_STAKING_ABI,
        functionName: 'stakeAndVouch',
        args: [validated.targetAgent as Address, BigInt(validated.cooldownPeriod)],
        value: stakeAmountWei,
        account: this.account,
        chain: this.chain,
      });
      return { success: true, transactionHash: hash, stakeAmount: validated.stakeAmount, targetAgent: validated.targetAgent as Address };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async unstakeFromAgent(targetAgent: Address): Promise<VouchResult> {
    if (!this.walletClient || !this.account) {
      return { success: false, error: 'Wallet not configured. Call setWallet() first.' };
    }
    try {
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: REPUTATION_STAKING_ABI,
        functionName: 'unstake',
        args: [targetAgent],
        account: this.account,
        chain: this.chain,
      });
      return { success: true, transactionHash: hash, targetAgent };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getVouchInfo(voucher: Address, targetAgent: Address): Promise<unknown> {
    if (!this.publicClient) throw new Error('Public client not initialized');
    try {
      const result = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: REPUTATION_STAKING_ABI,
        functionName: 'getVouch',
        args: [voucher, targetAgent],
      });
      return result;
    } catch (error) {
      throw new Error(`Failed to get vouch info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default VouchTool;

export const vouchToolDefinition = {
  type: 'function' as const,
  function: {
    name: 'vouch_for_agent',
    description: 'Vouch for an agent by staking CELO tokens',
    parameters: {
      type: 'object',
      properties: {
        targetAgent: { type: 'string', description: 'The Ethereum address of the agent to vouch for (0x...)' },
        stakeAmount: { type: 'string', description: 'Amount of CELO to stake (in CELO, not wei)' },
        cooldownPeriod: { type: 'number', description: 'Cooldown period in seconds (default: 86400 = 1 day)' },
      },
      required: ['targetAgent', 'stakeAmount'],
    },
  },
};
