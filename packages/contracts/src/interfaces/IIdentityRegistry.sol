// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IIdentityRegistry
 * @notice ERC-8004 Identity Registry Interface for AgentBond
 */
interface IIdentityRegistry {
    // Structs
    struct AgentIdentity {
        bytes32 identityId;
        address agentAddress;
        string metadata;
        uint256 registeredAt;
        bool isActive;
    }

    // Events
    event AgentRegistered(address indexed agent, bytes32 indexed identityId, string metadata);
    event AgentUpdated(address indexed agent, bytes32 indexed identityId, string metadata);
    event AgentDeactivated(address indexed agent, bytes32 indexed identityId);

    // View functions
    function getIdentity(address agent) external view returns (AgentIdentity memory);
    function getIdentityById(bytes32 identityId) external view returns (AgentIdentity memory);
    function isRegistered(address agent) external view returns (bool);
    function isActive(address agent) external view returns (bool);

    // Registration functions
    function registerAgent(string calldata metadata) external returns (bytes32);
    function registerAgentFor(address agent, string calldata metadata) external returns (bytes32);

    // Management functions
    function updateMetadata(string calldata metadata) external;
    function updateMetadataFor(address agent, string calldata metadata) external;
    function deactivateAgent() external;
    function deactivateAgentFor(address agent) external;

    // Batch functions
    function getAgents(uint256 offset, uint256 limit) external view returns (AgentIdentity[] memory);
    function getTotalAgents() external view returns (uint256);
}
