import {
  AgentRegistry,
  ReputationStaking,
  TaskEscrow,
} from "../typechain-types";

// Deployed contracts on Celo Alfajores testnet
const deployedContracts = {
  44787: {
    // Celo Alfajores chain ID
    name: "celo_alfajores",
    contracts: {
      // ERC-8004 Identity Registry (existing on Celo)
      IdentityRegistry: {
        address: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
        abi: [
          "function register(string calldata agentURI, bytes calldata metadata) external returns (uint256)",
          "function updateMetadataFor(address agent, string calldata metadata) external",
          "function deactivateAgentFor(address agent) external",
          "function balanceOf(address owner) external view returns (uint256)",
          "function ownerOf(uint256 tokenId) external view returns (address)",
          "function agentURI(uint256 tokenId) external view returns (string memory)",
          "event AgentRegistered(address indexed agent, uint256 indexed identityId, string agentURI)",
        ],
      },
      // ERC-8004 Reputation Registry (existing on Celo)
      ReputationRegistry: {
        address: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
        abi: [
          "function giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string calldata tag1, string calldata tag2, string calldata endpoint, string calldata ipfsHash, bytes32 dataHash) external",
          "function getSummary(uint256 agentId, address[] calldata trustedClients, string calldata tag1, string calldata tag2) external view returns (uint64 count, int128 value, uint8 decimals)",
          "event FeedbackGiven(uint256 indexed agentId, address indexed client, int128 value, uint8 valueDecimals, string tag1, string tag2)",
        ],
      },
      // AgentBond contracts (to be deployed)
      AgentRegistry: {
        address: "0x0000000000000000000000000000000000000000", // To be updated after deployment
        abi: [
          "function registerAgent(string calldata agentURI, string calldata metadata) external returns (uint256)",
          "function updateAgentMetadata(string calldata metadata) external",
          "function deactivateAgent() external",
          "function getAgent(address agentAddress) external view returns (uint256 identityId, string memory agentURI, bool isActive, uint256 reputation)",
          "function getAgentCount() external view returns (uint256)",
          "event AgentRegistered(address indexed agent, uint256 indexed identityId, string agentURI)",
          "event AgentUpdated(address indexed agent, string metadata)",
          "event AgentDeactivated(address indexed agent, uint256 identityId)",
        ],
      },
      ReputationStaking: {
        address: "0x0000000000000000000000000000000000000000", // To be updated after deployment
        abi: [
          "function vouch(address targetAgent, uint256 stakeAmount) external",
          "function withdrawVouch(address targetAgent) external",
          "function slashVouch(address voucher, address targetAgent, uint256 slashAmount) external",
          "function getVouch(address voucher, address targetAgent) external view returns (uint256 stakeAmount, uint256 timestamp, bool isActive)",
          "function getVouchees(address voucher) external view returns (address[] memory)",
          "function getVouchers(address targetAgent) external view returns (address[] memory)",
          "event Vouched(address indexed voucher, address indexed targetAgent, uint256 stakeAmount)",
          "event VouchWithdrawn(address indexed voucher, address indexed targetAgent, uint256 amount)",
          "event VouchSlashed(address indexed voucher, address indexed targetAgent, uint256 amount)",
        ],
      },
      TaskEscrow: {
        address: "0x0000000000000000000000000000000000000000", // To be updated after deployment
        abi: [
          "function createTask(uint256 taskId, address agent, uint256 payment) external",
          "function completeTask(uint256 taskId) external",
          "function disputeTask(uint256 taskId) external",
          "function resolveDispute(uint256 taskId, bool releaseToAgent) external",
          "function getTask(uint256 taskId) external view returns (address client, address agent, uint256 payment, uint8 status)",
          "event TaskCreated(uint256 indexed taskId, address indexed client, address indexed agent, uint256 payment)",
          "event TaskCompleted(uint256 indexed taskId, address indexed agent, uint256 payment)",
          "event TaskDisputed(uint256 indexed taskId, address indexed client)",
          "event DisputeResolved(uint256 indexed taskId, bool releaseToAgent)",
        ],
      },
    },
  },
} as const;

export default deployedContracts;
