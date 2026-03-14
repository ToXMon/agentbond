/**
 * ReputationStaking Contract ABI
 * Extracted from foundry compilation output
 */

export const REPUTATION_STAKING_ABI = [
  {
    "type": "function",
    "name": "stakeAndVouch",
    "inputs": [
      { "name": "targetAgent", "type": "address", "internalType": "address" },
      { "name": "cooldownPeriod", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "unstake",
    "inputs": [
      { "name": "targetAgent", "type": "address", "internalType": "address" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getVouch",
    "inputs": [
      { "name": "voucher", "type": "address", "internalType": "address" },
      { "name": "targetAgent", "type": "address", "internalType": "address" }
    ],
    "outputs": [
      { "name": "amount", "type": "uint256", "internalType": "uint256" },
      { "name": "cooldownEnd", "type": "uint256", "internalType": "uint256" },
      { "name": "isActive", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "reputationRegistry",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "contract IReputationRegistry" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "stakingToken",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "contract IERC20" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "Vouched",
    "inputs": [
      { "name": "voucher", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "targetAgent", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Unstaked",
    "inputs": [
      { "name": "voucher", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "targetAgent", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  }
] as const;

export default REPUTATION_STAKING_ABI;
