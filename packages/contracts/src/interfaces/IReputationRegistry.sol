// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IReputationRegistry
 * @notice Interface for ERC-8004 Reputation Registry
 * @dev Based on ERC-8004 standard for agent reputation management
 */
interface IReputationRegistry {
    // Events
    event ReputationUpdated(address indexed agent, uint256 newScore, uint256 oldScore, string reason);
    event ReputationStaked(address indexed agent, address indexed staker, uint256 amount);
    event ReputationSlashed(address indexed agent, uint256 amount, string reason);

    // Structs
    struct ReputationData {
        uint256 score;
        uint256 totalStaked;
        uint256 tasksCompleted;
        uint256 tasksFailed;
        uint256 lastUpdated;
        bool isVerified;
    }

    // View functions
    function getReputation(address agent) external view returns (ReputationData memory);
    function getScore(address agent) external view returns (uint256);
    function getTotalStaked(address agent) external view returns (uint256);
    function getTasksCompleted(address agent) external view returns (uint256);
    function isVerified(address agent) external view returns (bool);
    function hasMinimumReputation(address agent, uint256 threshold) external view returns (bool);
    
    // Reputation management
    function updateReputation(address agent, int256 delta, string calldata reason) external;
    function recordTaskCompletion(address agent, bool success) external;
    
    // Staking functions
    function stakeReputation(address agent) external payable;
    function unstakeReputation(uint256 amount) external;
    function slashReputation(address agent, uint256 amount, string calldata reason) external;
    
    // Verification
    function verifyAgent(address agent) external;
    function revokeVerification(address agent) external;
    
    // Batch functions
    function getTopAgents(uint256 limit) external view returns (address[] memory, uint256[] memory);
}
