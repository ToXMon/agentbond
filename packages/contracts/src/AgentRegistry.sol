// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/IIdentityRegistry.sol";

/**
 * @title AgentRegistry
 * @notice Wrapper contract for ERC-8004 Identity Registry with helper functions
 * @dev Provides simplified interface for agent registration and management
 */
contract AgentRegistry is Ownable, ReentrancyGuard {
    using Address for address;

    // ============ State Variables ============

    /// @notice The ERC-8004 Identity Registry contract
    IIdentityRegistry public immutable identityRegistry;

    /// @notice Mapping of agent addresses to their metadata hashes
    mapping(address => bytes32) public agentMetadataHashes;

    /// @notice Mapping of agent addresses to registration timestamps
    mapping(address => uint256) public registrationTimestamps;

    /// @notice Array of all registered agent addresses
    address[] public registeredAgents;

    /// @notice Mapping to check if address is in registeredAgents array
    mapping(address => bool) public isAgentRegistered;

    /// @notice Authorized contracts that can call restricted functions
    mapping(address => bool) public authorizedCallers;

    // ============ Constants ============

    /// @notice Minimum metadata length
    uint256 public constant MIN_METADATA_LENGTH = 1;

    /// @notice Maximum metadata length
    uint256 public constant MAX_METADATA_LENGTH = 2048;

    // ============ Events ============

    event AgentRegisteredExtended(
        address indexed agent,
        bytes32 indexed identityId,
        string metadata,
        uint256 timestamp
    );

    event AgentUpdatedExtended(
        address indexed agent,
        bytes32 indexed identityId,
        string metadata,
        uint256 timestamp
    );

    event AgentDeactivatedExtended(
        address indexed agent,
        bytes32 indexed identityId,
        uint256 timestamp
    );

    event AuthorizedCallerUpdated(address indexed caller, bool isAuthorized);

    event MetadataHashUpdated(address indexed agent, bytes32 hash);

    // ============ Errors ============

    error AgentRegistry__AlreadyRegistered();
    error AgentRegistry__NotRegistered();
    error AgentRegistry__InvalidMetadataLength();
    error AgentRegistry__Unauthorized();
    error AgentRegistry__AgentNotActive();
    error AgentRegistry__InvalidIdentityRegistry();

    // ============ Modifiers ============

    modifier onlyAuthorized() {
        if (!authorizedCallers[msg.sender] && msg.sender != owner()) {
            revert AgentRegistry__Unauthorized();
        }
        _;
    }

    modifier onlyRegisteredAgent() {
        if (!isAgentRegistered[msg.sender]) {
            revert AgentRegistry__NotRegistered();
        }
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Initialize the AgentRegistry
     * @param _identityRegistry Address of the ERC-8004 Identity Registry
     * @param initialOwner Address of the initial owner
     */
    constructor(
        address _identityRegistry,
        address initialOwner
    ) Ownable(initialOwner) {
        if (_identityRegistry == address(0)) {
            revert AgentRegistry__InvalidIdentityRegistry();
        }
        identityRegistry = IIdentityRegistry(_identityRegistry);
    }

    // ============ External Functions ============

    /**
     * @notice Register a new agent with metadata
     * @param metadata JSON or URI containing agent metadata
     * @return identityId The unique identifier for the registered agent
     */
    function registerAgent(
        string calldata metadata
    ) external nonReentrant returns (bytes32 identityId) {
        _validateMetadata(metadata);

        if (isAgentRegistered[msg.sender]) {
            revert AgentRegistry__AlreadyRegistered();
        }

        // Register with ERC-8004 Identity Registry
        identityId = identityRegistry.registerAgentFor(msg.sender, metadata);

        // Store additional tracking data
        agentMetadataHashes[msg.sender] = keccak256(bytes(metadata));
        registrationTimestamps[msg.sender] = block.timestamp;
        registeredAgents.push(msg.sender);
        isAgentRegistered[msg.sender] = true;

        emit AgentRegisteredExtended(
            msg.sender,
            identityId,
            metadata,
            block.timestamp
        );
    }

    /**
     * @notice Update agent metadata
     * @param metadata New metadata JSON or URI
     */
    function updateAgentMetadata(
        string calldata metadata
    ) external onlyRegisteredAgent nonReentrant {
        _validateMetadata(metadata);

        // Get current identity
        IIdentityRegistry.AgentIdentity memory identity = identityRegistry
            .getIdentity(msg.sender);

        // Update in ERC-8004 registry
        identityRegistry.updateMetadataFor(msg.sender, metadata);

        // Update local hash
        agentMetadataHashes[msg.sender] = keccak256(bytes(metadata));

        emit AgentUpdatedExtended(
            msg.sender,
            identity.identityId,
            metadata,
            block.timestamp
        );
    }

    /**
     * @notice Deactivate an agent
     */
    function deactivateAgent() external onlyRegisteredAgent nonReentrant {
        IIdentityRegistry.AgentIdentity memory identity = identityRegistry
            .getIdentity(msg.sender);

        identityRegistry.deactivateAgentFor(msg.sender);

        isAgentRegistered[msg.sender] = false;

        emit AgentDeactivatedExtended(
            msg.sender,
            identity.identityId,
            block.timestamp
        );
    }

    /**
     * @notice Check if agent is registered and active
     * @param agent Address to check
     * @return True if agent is registered and active
     */
    function isAgentActive(address agent) external view returns (bool) {
        return isAgentRegistered[agent] && identityRegistry.isActive(agent);
    }

    /**
     * @notice Get agent information
     * @param agent Address of the agent
     * @return identityId Unique identifier
     * @return metadataHash Hash of metadata
     * @return registeredAt Registration timestamp
     * @return isActive Whether agent is active
     */
    function getAgentInfo(
        address agent
    )
        external
        view
        returns (
            bytes32 identityId,
            bytes32 metadataHash,
            uint256 registeredAt,
            bool isActive
        )
    {
        IIdentityRegistry.AgentIdentity memory identity = identityRegistry
            .getIdentity(agent);

        return (
            identity.identityId,
            agentMetadataHashes[agent],
            registrationTimestamps[agent],
            identity.isActive
        );
    }

    /**
     * @notice Get total number of registered agents
     * @return count Number of registered agents
     */
    function getTotalRegisteredAgents() external view returns (uint256) {
        return registeredAgents.length;
    }

    /**
     * @notice Get paginated list of registered agents
     * @param offset Starting index
     * @param limit Maximum number to return
     * @return agents Array of agent addresses
     */
    function getRegisteredAgents(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory agents) {
        uint256 total = registeredAgents.length;
        
        if (offset >= total) {
            return new address[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 length = end - offset;
        agents = new address[](length);

        for (uint256 i = 0; i < length; i++) {
            agents[i] = registeredAgents[offset + i];
        }

        return agents;
    }

    // ============ Admin Functions ============

    /**
     * @notice Set authorized caller status
     * @param caller Address to update
     * @param isAuthorized Whether the address is authorized
     */
    function setAuthorizedCaller(
        address caller,
        bool isAuthorized
    ) external onlyOwner {
        authorizedCallers[caller] = isAuthorized;
        emit AuthorizedCallerUpdated(caller, isAuthorized);
    }

    /**
     * @notice Register agent on behalf of another address (authorized only)
     * @param agent Address to register
     * @param metadata Agent metadata
     * @return identityId The unique identifier
     */
    function registerAgentFor(
        address agent,
        string calldata metadata
    ) external onlyAuthorized nonReentrant returns (bytes32 identityId) {
        _validateMetadata(metadata);

        if (isAgentRegistered[agent]) {
            revert AgentRegistry__AlreadyRegistered();
        }

        identityId = identityRegistry.registerAgentFor(agent, metadata);

        agentMetadataHashes[agent] = keccak256(bytes(metadata));
        registrationTimestamps[agent] = block.timestamp;
        registeredAgents.push(agent);
        isAgentRegistered[agent] = true;

        emit AgentRegisteredExtended(
            agent,
            identityId,
            metadata,
            block.timestamp
        );
    }

    // ============ Internal Functions ============

    /**
     * @notice Validate metadata string
     * @param metadata Metadata to validate
     */
    function _validateMetadata(
        string calldata metadata
    ) internal pure {
        uint256 length = bytes(metadata).length;
        if (length < MIN_METADATA_LENGTH || length > MAX_METADATA_LENGTH) {
            revert AgentRegistry__InvalidMetadataLength();
        }
    }
}
