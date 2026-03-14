// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/AgentRegistry.sol";
import "../src/interfaces/IIdentityRegistry.sol";

/**
 * @title MockIdentityRegistry
 * @notice Mock implementation of ERC-8004 Identity Registry for testing
 */
contract MockIdentityRegistry is IIdentityRegistry {
    mapping(address => AgentIdentity) private identities;
    mapping(bytes32 => address) private identityToAddress;
    address[] private allAgents;
    uint256 private totalAgentsCount;

    function registerAgent(
        string calldata metadata
    ) external override returns (bytes32 identityId) {
        identityId = keccak256(abi.encodePacked(msg.sender, block.timestamp));
        _register(msg.sender, identityId, metadata);
        return identityId;
    }

    function registerAgentFor(
        address agent,
        string calldata metadata
    ) external override returns (bytes32 identityId) {
        identityId = keccak256(abi.encodePacked(agent, block.timestamp));
        _register(agent, identityId, metadata);
        return identityId;
    }

    function _register(
        address agent,
        bytes32 identityId,
        string memory metadata
    ) internal {
        identities[agent] = AgentIdentity({
            identityId: identityId,
            agentAddress: agent,
            metadata: metadata,
            registeredAt: block.timestamp,
            isActive: true
        });
        identityToAddress[identityId] = agent;
        allAgents.push(agent);
        totalAgentsCount++;
        emit AgentRegistered(agent, identityId, metadata);
    }

    function updateMetadata(string calldata metadata) external override {
        require(identities[msg.sender].isActive, "Not registered");
        bytes32 identityId = identities[msg.sender].identityId;
        identities[msg.sender].metadata = metadata;
        emit AgentUpdated(msg.sender, identityId, metadata);
    }

    function deactivateAgent() external override {
        require(identities[msg.sender].isActive, "Not registered");
        bytes32 identityId = identities[msg.sender].identityId;
        identities[msg.sender].isActive = false;
        emit AgentDeactivated(msg.sender, identityId);
    }

    function updateMetadataFor(address agent, string calldata metadata) external override {
        require(identities[agent].isActive, "Not registered");
        bytes32 identityId = identities[agent].identityId;
        identities[agent].metadata = metadata;
        emit AgentUpdated(agent, identityId, metadata);
    }

    function deactivateAgentFor(address agent) external override {
        require(identities[agent].isActive, "Not registered");
        bytes32 identityId = identities[agent].identityId;
        identities[agent].isActive = false;
        emit AgentDeactivated(agent, identityId);
    }

    function getIdentity(
        address agent
    ) external view override returns (AgentIdentity memory) {
        return identities[agent];
    }

    function getIdentityById(
        bytes32 identityId
    ) external view override returns (AgentIdentity memory) {
        return identities[identityToAddress[identityId]];
    }

    function isRegistered(address agent) external view override returns (bool) {
        return identities[agent].identityId != bytes32(0);
    }

    function isActive(address agent) external view override returns (bool) {
        return identities[agent].isActive;
    }

    function getAgents(
        uint256 offset,
        uint256 limit
    ) external view override returns (AgentIdentity[] memory) {
        uint256 total = allAgents.length;
        if (offset >= total) {
            return new AgentIdentity[](0);
        }
        uint256 end = offset + limit;
        if (end > total) end = total;
        uint256 length = end - offset;
        AgentIdentity[] memory result = new AgentIdentity[](length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = identities[allAgents[offset + i]];
        }
        return result;
    }

    function getTotalAgents() external view override returns (uint256) {
        return totalAgentsCount;
    }
}

contract AgentRegistryTest is Test {
    AgentRegistry public registry;
    MockIdentityRegistry public mockIdentityRegistry;

    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public authorizedCaller = address(0x4);

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

    function setUp() public {
        vm.startPrank(owner);
        mockIdentityRegistry = new MockIdentityRegistry();
        registry = new AgentRegistry(
            address(mockIdentityRegistry),
            owner
        );
        vm.stopPrank();
    }

    // ============ Registration Tests ============

    function test_RegisterAgent() public {
        string memory metadata = '{"name":"Test Agent","version":"1.0"}';

        vm.prank(user1);
        // Event is emitted with generated identityId
        bytes32 identityId = registry.registerAgent(metadata);

        assertTrue(registry.isAgentRegistered(user1));
        assertTrue(identityId != bytes32(0));
    }

    function test_RevertWhen_AlreadyRegistered() public {
        string memory metadata = '{"name":"Test Agent"}';

        vm.prank(user1);
        registry.registerAgent(metadata);

        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(AgentRegistry.AgentRegistry__AlreadyRegistered.selector)
        );
        registry.registerAgent(metadata);
    }

    function test_RevertWhen_InvalidMetadataLength() public {
        string memory emptyMetadata = "";

        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(AgentRegistry.AgentRegistry__InvalidMetadataLength.selector)
        );
        registry.registerAgent(emptyMetadata);
    }

    function test_RegisterAgentWithMaxMetadata() public {
        // Create metadata with max length (2048 bytes)
        string memory metadata = new string(2048);
        // In practice, we'd fill this with actual content

        vm.prank(user1);
        bytes32 identityId = registry.registerAgent(metadata);
        assertTrue(identityId != bytes32(0));
    }

    // ============ Update Tests ============

    function test_UpdateAgentMetadata() public {
        string memory initialMetadata = '{"name":"Initial"}';
        string memory updatedMetadata = '{"name":"Updated"}';

        vm.startPrank(user1);
        registry.registerAgent(initialMetadata);

        registry.updateAgentMetadata(updatedMetadata);
        vm.stopPrank();
    }

    function test_RevertWhen_UpdateNotRegistered() public {
        string memory metadata = '{"name":"Test"}';

        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(AgentRegistry.AgentRegistry__NotRegistered.selector)
        );
        registry.updateAgentMetadata(metadata);
    }

    // ============ Deactivation Tests ============

    function test_DeactivateAgent() public {
        string memory metadata = '{"name":"Test"}';

        vm.startPrank(user1);
        registry.registerAgent(metadata);
        
        // Verify agent is registered
        assertTrue(registry.isAgentRegistered(user1));
        
        // Deactivate the agent
        registry.deactivateAgent();
        
        // Verify agent is no longer registered
        assertFalse(registry.isAgentRegistered(user1));
        
        vm.stopPrank();
    }

    // ============ View Function Tests ============

    function test_GetAgentInfo() public {
        string memory metadata = '{"name":"Test Agent"}';

        vm.prank(user1);
        bytes32 identityId = registry.registerAgent(metadata);

        (
            bytes32 returnedId,
            bytes32 metadataHash,
            uint256 registeredAt,
            bool isActive
        ) = registry.getAgentInfo(user1);

        assertEq(returnedId, identityId);
        assertTrue(metadataHash != bytes32(0));
        assertGt(registeredAt, 0);
        assertTrue(isActive);
    }

    function test_GetTotalRegisteredAgents() public {
        assertEq(registry.getTotalRegisteredAgents(), 0);

        vm.prank(user1);
        registry.registerAgent('{"name":"Agent1"}');
        assertEq(registry.getTotalRegisteredAgents(), 1);

        vm.prank(user2);
        registry.registerAgent('{"name":"Agent2"}');
        assertEq(registry.getTotalRegisteredAgents(), 2);
    }

    function test_GetRegisteredAgents_Pagination() public {
        // Register 5 agents
        for (uint256 i = 0; i < 5; i++) {
            address agent = address(uint160(i + 100));
            vm.prank(agent);
            registry.registerAgent('{"name":"Agent"}');
        }

        // Test pagination
        address[] memory page1 = registry.getRegisteredAgents(0, 2);
        assertEq(page1.length, 2);

        address[] memory page2 = registry.getRegisteredAgents(2, 2);
        assertEq(page2.length, 2);

        address[] memory page3 = registry.getRegisteredAgents(4, 2);
        assertEq(page3.length, 1);

        address[] memory emptyPage = registry.getRegisteredAgents(10, 2);
        assertEq(emptyPage.length, 0);
    }

    function test_IsAgentActive() public {
        string memory metadata = '{"name":"Test"}';

        vm.prank(user1);
        registry.registerAgent(metadata);

        assertTrue(registry.isAgentActive(user1));
        assertFalse(registry.isAgentActive(user2));
    }

    // ============ Admin Function Tests ============

    function test_SetAuthorizedCaller() public {
        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit AuthorizedCallerUpdated(authorizedCaller, true);
        registry.setAuthorizedCaller(authorizedCaller, true);

        assertTrue(registry.authorizedCallers(authorizedCaller));
    }

    function test_RegisterAgentFor_Authorized() public {
        vm.prank(owner);
        registry.setAuthorizedCaller(authorizedCaller, true);

        string memory metadata = '{"name":"Test"}';

        vm.prank(authorizedCaller);
        bytes32 identityId = registry.registerAgentFor(user1, metadata);
        assertTrue(identityId != bytes32(0));
        assertTrue(registry.isAgentRegistered(user1));
    }

    function test_RevertWhen_RegisterAgentFor_Unauthorized() public {
        string memory metadata = '{"name":"Test"}';

        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(AgentRegistry.AgentRegistry__Unauthorized.selector)
        );
        registry.registerAgentFor(user2, metadata);
    }

    // ============ Edge Case Tests ============

    function test_MultipleRegistrations() public {
        address[] memory agents = new address[](10);

        for (uint256 i = 0; i < 10; i++) {
            agents[i] = address(uint160(i + 1000));
            vm.prank(agents[i]);
            registry.registerAgent('{"id":"test"}');
        }

        assertEq(registry.getTotalRegisteredAgents(), 10);

        for (uint256 i = 0; i < 10; i++) {
            assertTrue(registry.isAgentRegistered(agents[i]));
        }
    }
}
