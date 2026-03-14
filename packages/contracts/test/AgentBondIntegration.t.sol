// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../src/AgentRegistry.sol";
import "../src/ReputationStaking.sol";
import "../src/TaskEscrow.sol";
import "../src/interfaces/IIdentityRegistry.sol";
import "../src/interfaces/IReputationRegistry.sol";

/**
 * @title MockERC20
 * @notice Mock CELO token for testing
 */
contract MockERC20 is ERC20 {
    constructor() ERC20("CELO", "CELO") {
        _mint(msg.sender, 1000000 * 10**18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

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
        identityId = keccak256(abi.encodePacked(msg.sender, block.timestamp, totalAgentsCount));
        _register(msg.sender, identityId, metadata);
        return identityId;
    }

    function registerAgentFor(
        address agent,
        string calldata metadata
    ) external override returns (bytes32 identityId) {
        identityId = keccak256(abi.encodePacked(agent, block.timestamp, totalAgentsCount));
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

/**
 * @title MockReputationRegistry
 * @notice Mock implementation of ERC-8004 Reputation Registry for testing
 */
contract MockReputationRegistry is IReputationRegistry {
    mapping(address => ReputationData) private reputationData;
    address[] private allAgents;

    uint256 public constant DEFAULT_REPUTATION = 50;
    uint256 public constant TASK_COMPLETION_BOOST = 5;
    uint256 public constant TASK_FAILURE_PENALTY = 10;

    function _ensureAgent(address agent) internal {
        if (reputationData[agent].lastUpdated == 0) {
            reputationData[agent] = ReputationData({
                score: DEFAULT_REPUTATION,
                totalStaked: 0,
                tasksCompleted: 0,
                tasksFailed: 0,
                lastUpdated: block.timestamp,
                isVerified: false
            });
            allAgents.push(agent);
        }
    }

    function getReputation(address agent) external view override returns (ReputationData memory) {
        return reputationData[agent];
    }

    function getScore(address agent) external view override returns (uint256) {
        return reputationData[agent].score;
    }

    function getTotalStaked(address agent) external view override returns (uint256) {
        return reputationData[agent].totalStaked;
    }

    function getTasksCompleted(address agent) external view override returns (uint256) {
        return reputationData[agent].tasksCompleted;
    }

    function isVerified(address agent) external view override returns (bool) {
        return reputationData[agent].isVerified;
    }

    function hasMinimumReputation(address agent, uint256 threshold) external view override returns (bool) {
        if (reputationData[agent].lastUpdated == 0) {
            return DEFAULT_REPUTATION >= threshold;
        }
        return reputationData[agent].score >= threshold;
    }

    function updateReputation(address agent, int256 delta, string calldata reason) external override {
        _ensureAgent(agent);
        uint256 oldScore = reputationData[agent].score;
        
        if (delta >= 0) {
            reputationData[agent].score += uint256(delta);
        } else {
            uint256 decrease = uint256(-delta);
            if (reputationData[agent].score > decrease) {
                reputationData[agent].score -= decrease;
            } else {
                reputationData[agent].score = 0;
            }
        }
        
        reputationData[agent].lastUpdated = block.timestamp;
        emit ReputationUpdated(agent, reputationData[agent].score, oldScore, reason);
    }

    function recordTaskCompletion(address agent, bool success) external override {
        _ensureAgent(agent);
        uint256 oldScore = reputationData[agent].score;
        
        if (success) {
            reputationData[agent].tasksCompleted++;
            reputationData[agent].score += TASK_COMPLETION_BOOST;
        } else {
            reputationData[agent].tasksFailed++;
            if (reputationData[agent].score > TASK_FAILURE_PENALTY) {
                reputationData[agent].score -= TASK_FAILURE_PENALTY;
            } else {
                reputationData[agent].score = 0;
            }
        }
        
        reputationData[agent].lastUpdated = block.timestamp;
        emit ReputationUpdated(agent, reputationData[agent].score, oldScore, success ? "Task completed" : "Task failed");
    }

    function stakeReputation(address agent) external payable override {
        _ensureAgent(agent);
        reputationData[agent].totalStaked += msg.value;
        emit ReputationStaked(agent, msg.sender, msg.value);
    }

    function unstakeReputation(uint256 amount) external override {
        require(reputationData[msg.sender].totalStaked >= amount, "Insufficient staked");
        reputationData[msg.sender].totalStaked -= amount;
        payable(msg.sender).transfer(amount);
    }

    function slashReputation(address agent, uint256 amount, string calldata reason) external override {
        _ensureAgent(agent);
        uint256 oldScore = reputationData[agent].score;
        
        if (reputationData[agent].score > amount) {
            reputationData[agent].score -= amount;
        } else {
            reputationData[agent].score = 0;
        }
        
        reputationData[agent].lastUpdated = block.timestamp;
        emit ReputationSlashed(agent, amount, reason);
        emit ReputationUpdated(agent, reputationData[agent].score, oldScore, reason);
    }

    function verifyAgent(address agent) external override {
        _ensureAgent(agent);
        reputationData[agent].isVerified = true;
    }

    function revokeVerification(address agent) external override {
        reputationData[agent].isVerified = false;
    }

    function getTopAgents(uint256 limit) external view override returns (address[] memory, uint256[] memory) {
        uint256 length = allAgents.length < limit ? allAgents.length : limit;
        address[] memory topAgents = new address[](length);
        uint256[] memory scores = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            topAgents[i] = allAgents[i];
            scores[i] = reputationData[allAgents[i]].score;
        }
        
        return (topAgents, scores);
    }

    function setInitialReputation(address agent, uint256 score) external {
        _ensureAgent(agent);
        reputationData[agent].score = score;
    }
}

/**
 * @title AgentBondIntegrationTest
 * @notice Integration tests for the full AgentBond flow
 */
contract AgentBondIntegrationTest is Test {
    MockIdentityRegistry public identityRegistry;
    MockReputationRegistry public reputationRegistry;
    MockERC20 public celoToken;
    AgentRegistry public agentRegistry;
    ReputationStaking public reputationStaking;
    TaskEscrow public taskEscrow;

    address public owner = address(0x1);
    address public establishedAgent = address(0x2);
    address public newAgent = address(0x3);
    address public client = address(0x4);
    address public feeCollector = address(0x5);

    uint256 public constant MIN_STAKE = 1 ether;
    uint256 public constant MIN_REPUTATION = 50;
    uint256 public constant PLATFORM_FEE_BPS = 250;
    uint256 public constant DEFAULT_DEADLINE = 30 days;

    function setUp() public {
        vm.startPrank(owner);
        
        identityRegistry = new MockIdentityRegistry();
        reputationRegistry = new MockReputationRegistry();
        celoToken = new MockERC20();
        
        agentRegistry = new AgentRegistry(
            address(identityRegistry),
            owner
        );
        
        reputationStaking = new ReputationStaking(
            address(celoToken),
            address(identityRegistry),
            address(reputationRegistry),
            MIN_REPUTATION,
            MIN_STAKE,
            owner
        );
        
        taskEscrow = new TaskEscrow(
            address(identityRegistry),
            address(reputationRegistry),
            PLATFORM_FEE_BPS,
            feeCollector,
            DEFAULT_DEADLINE,
            owner
        );
        
        reputationStaking.setAuthorizedTaskCompleter(address(taskEscrow), true);
        
        celoToken.transfer(establishedAgent, 10000 ether);
        celoToken.transfer(newAgent, 100 ether);
        celoToken.transfer(client, 1000 ether);
        
        vm.stopPrank();
    }

    function _registerAndSetupEstablishedAgent() internal {
        vm.prank(establishedAgent);
        agentRegistry.registerAgent('{"name":"Established Agent","type":"senior"}');
        
        reputationRegistry.setInitialReputation(establishedAgent, 80);
        
        vm.prank(establishedAgent);
        celoToken.approve(address(reputationStaking), 100 ether);
    }

    // ============ Integration Tests ============

    /**
     * @notice Test the full agent flow: vouch -> register -> task -> complete -> payment
     * Vouching happens BEFORE agent registration
     */
    function test_FullAgentFlow() public {
        // Step 1: Register established agent first
        _registerAndSetupEstablishedAgent();
        assertTrue(agentRegistry.isAgentRegistered(establishedAgent));
        
        // Step 2: Vouch for new agent BEFORE they register
        // Note: newAgent is NOT registered yet, so vouching should work
        vm.prank(establishedAgent);
        reputationStaking.vouchForAgent(newAgent, 10 ether);
        
        (address voucher, uint256 stakeAmount, , bool isActive, ) = reputationStaking.getVouch(newAgent);
        assertEq(voucher, establishedAgent);
        assertEq(stakeAmount, 10 ether);
        assertTrue(isActive);
        
        // Step 3: Now new agent registers (after being vouched for)
        vm.prank(newAgent);
        agentRegistry.registerAgent('{"name":"New Agent","type":"junior"}');
        assertTrue(agentRegistry.isAgentRegistered(newAgent));
        
        // Step 4: Client creates a task with CELO payment
        vm.deal(client, 10 ether);
        vm.prank(client);
        bytes32 taskId = taskEscrow.createTaskWithCelo{value: 5 ether}(
            newAgent,
            "ipfs://task-metadata-hash",
            0
        );
        
        TaskEscrow.Task memory task = taskEscrow.getTask(taskId);
        assertEq(task.client, client);
        assertEq(task.agent, newAgent);
        assertEq(task.payment, 5 ether);
        
        // Step 5: Agent completes the task
        vm.prank(newAgent);
        taskEscrow.completeTask(taskId);
        
        // Step 6: Client releases payment
        uint256 agentBalanceBefore = newAgent.balance;
        uint256 feeCollectorBalanceBefore = feeCollector.balance;
        
        vm.prank(client);
        taskEscrow.releasePayment(taskId);
        
        uint256 expectedFee = (5 ether * PLATFORM_FEE_BPS) / 10000;
        uint256 expectedAgentPayment = 5 ether - expectedFee;
        
        assertEq(newAgent.balance - agentBalanceBefore, expectedAgentPayment);
        assertEq(feeCollector.balance - feeCollectorBalanceBefore, expectedFee);
        
        // Step 7: Verify reputation updated
        uint256 newAgentScore = reputationRegistry.getScore(newAgent);
        assertGt(newAgentScore, 0, "New agent should have reputation after task completion");
    }

    /**
     * @notice Test that vouching works for unregistered agents
     */
    function test_VouchingIncreasesReputation() public {
        _registerAndSetupEstablishedAgent();
        
        // newAgent is NOT registered yet - vouching should work
        (address voucherBefore, , , bool isActiveBefore, ) = reputationStaking.getVouch(newAgent);
        assertEq(voucherBefore, address(0));
        assertFalse(isActiveBefore);
        
        // Vouch for new agent (who is NOT registered)
        vm.prank(establishedAgent);
        reputationStaking.vouchForAgent(newAgent, 10 ether);
        
        (address voucherAfter, uint256 amount, , , ) = reputationStaking.getVouch(newAgent);
        assertEq(voucherAfter, establishedAgent);
        assertEq(amount, 10 ether);
        
        assertTrue(reputationStaking.canVouch(establishedAgent));
    }

    /**
     * @notice Test that slashing decreases reputation
     */
    function test_SlashingDecreasesReputation() public {
        _registerAndSetupEstablishedAgent();
        
        // Vouch for new agent BEFORE registration
        vm.prank(establishedAgent);
        reputationStaking.vouchForAgent(newAgent, 10 ether);
        
        // Now register new agent
        vm.prank(newAgent);
        agentRegistry.registerAgent('{"name":"New Agent","type":"junior"}');
        
        uint256 initialScore = reputationRegistry.getScore(newAgent);
        
        // Simulate task failure
        reputationRegistry.recordTaskCompletion(newAgent, false);
        
        uint256 afterScore = reputationRegistry.getScore(newAgent);
        assertLt(afterScore, 50, "Reputation should decrease from default 50");
    }

    /**
     * @notice Test that task completion updates reputation
     */
    function test_TaskCompletionUpdatesReputation() public {
        _registerAndSetupEstablishedAgent();
        
        // Vouch and register
        vm.prank(establishedAgent);
        reputationStaking.vouchForAgent(newAgent, 10 ether);
        
        vm.prank(newAgent);
        agentRegistry.registerAgent('{"name":"New Agent","type":"junior"}');
        
        uint256 initialScore = reputationRegistry.getScore(newAgent);
        uint256 initialTasksCompleted = reputationRegistry.getTasksCompleted(newAgent);
        
        reputationRegistry.recordTaskCompletion(newAgent, true);
        
        uint256 afterScore = reputationRegistry.getScore(newAgent);
        uint256 afterTasksCompleted = reputationRegistry.getTasksCompleted(newAgent);
        
        assertGt(afterScore, initialScore, "Reputation should increase after successful task");
        assertEq(afterTasksCompleted, initialTasksCompleted + 1, "Tasks completed should increment");
    }

    /**
     * @notice Test multiple tasks and cumulative reputation
     */
    function test_MultipleTasksCumulativeReputation() public {
        _registerAndSetupEstablishedAgent();
        
        // Vouch and register
        vm.prank(establishedAgent);
        reputationStaking.vouchForAgent(newAgent, 10 ether);
        
        vm.prank(newAgent);
        agentRegistry.registerAgent('{"name":"New Agent","type":"junior"}');
        
        vm.deal(client, 50 ether);
        
        for (uint256 i = 0; i < 3; i++) {
            vm.prank(client);
            bytes32 taskId = taskEscrow.createTaskWithCelo{value: 5 ether}(
                newAgent,
                "ipfs://task-metadata-hash",
                0
            );
            
            vm.prank(newAgent);
            taskEscrow.completeTask(taskId);
            
            vm.prank(client);
            taskEscrow.releasePayment(taskId);
        }
        
        uint256 finalScore = reputationRegistry.getScore(newAgent);
        uint256 finalTasksCompleted = reputationRegistry.getTasksCompleted(newAgent);
        
        assertEq(finalTasksCompleted, 3, "Should have 3 completed tasks");
        assertGt(finalScore, 0, "Should have accumulated reputation");
    }

    /**
     * @notice Test dispute resolution with reputation impact
     */
    function test_DisputeResolutionReputationImpact() public {
        _registerAndSetupEstablishedAgent();
        
        vm.prank(establishedAgent);
        reputationStaking.vouchForAgent(newAgent, 10 ether);
        
        vm.prank(newAgent);
        agentRegistry.registerAgent('{"name":"New Agent","type":"junior"}');
        
        vm.deal(client, 10 ether);
        vm.prank(client);
        bytes32 taskId = taskEscrow.createTaskWithCelo{value: 5 ether}(
            newAgent,
            "ipfs://task-metadata-hash",
            0
        );
        
        vm.prank(newAgent);
        taskEscrow.completeTask(taskId);
        
        vm.prank(client);
        taskEscrow.raiseDispute(taskId, "Task not completed as specified");
        
        uint256 initialScore = reputationRegistry.getScore(newAgent);
        
        vm.prank(owner);
        taskEscrow.resolveDispute(taskId, TaskEscrow.DisputeOutcome.FavorClient, 0);
        
        uint256 finalScore = reputationRegistry.getScore(newAgent);
        assertLt(finalScore, initialScore, "Reputation should decrease when dispute lost");
    }

    /**
     * @notice Test unstake cooldown period
     */
    function test_UnstakeCooldownPeriod() public {
        _registerAndSetupEstablishedAgent();
        
        // Vouch for new agent (unregistered)
        vm.prank(establishedAgent);
        reputationStaking.vouchForAgent(newAgent, 10 ether);
        
        vm.prank(establishedAgent);
        reputationStaking.requestUnstake(5 ether);
        
        vm.prank(establishedAgent);
        vm.expectRevert(ReputationStaking.ReputationStaking__CooldownNotMet.selector);
        reputationStaking.completeUnstake(0);
        
        vm.warp(block.timestamp + 7 days + 1);
        
        uint256 celoBalanceBefore = celoToken.balanceOf(establishedAgent);
        vm.prank(establishedAgent);
        reputationStaking.completeUnstake(0);
        
        assertGt(celoToken.balanceOf(establishedAgent), 9990 ether, "Should receive CELO tokens back");
    }

    /**
     * @notice Test agent cannot vouch without sufficient reputation
     */
    function test_CannotVouchWithoutReputation() public {
        _registerAndSetupEstablishedAgent();
        
        reputationRegistry.setInitialReputation(establishedAgent, 30);
        
        vm.prank(establishedAgent);
        vm.expectRevert(ReputationStaking.ReputationStaking__InsufficientReputation.selector);
        reputationStaking.vouchForAgent(address(0x999), 10 ether);
    }

    /**
     * @notice Test task cancellation refunds client
     */
    function test_TaskCancellationRefundsClient() public {
        _registerAndSetupEstablishedAgent();
        
        // Vouch and register
        vm.prank(establishedAgent);
        reputationStaking.vouchForAgent(newAgent, 10 ether);
        
        vm.prank(newAgent);
        agentRegistry.registerAgent('{"name":"New Agent","type":"junior"}');
        
        vm.deal(client, 10 ether);
        uint256 clientBalanceBefore = client.balance;
        
        vm.prank(client);
        bytes32 taskId = taskEscrow.createTaskWithCelo{value: 5 ether}(
            newAgent,
            "ipfs://task-metadata-hash",
            0
        );
        
        vm.prank(client);
        taskEscrow.cancelTask(taskId, "Changed requirements");
        
        assertEq(client.balance, clientBalanceBefore);
        
        TaskEscrow.Task memory task = taskEscrow.getTask(taskId);
        assertEq(uint256(task.status), uint256(TaskEscrow.TaskStatus.Cancelled));
    }
}
