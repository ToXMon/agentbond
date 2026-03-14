// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/TaskEscrow.sol";
import "./AgentRegistry.t.sol"; // Reuse MockIdentityRegistry
import "./ReputationStaking.t.sol"; // Reuse MockReputationRegistry, MockERC20

contract TaskEscrowTest is Test {
    TaskEscrow public escrow;
    MockIdentityRegistry public mockIdentityRegistry;
    MockReputationRegistry public mockReputationRegistry;

    address public owner = address(0x1);
    address public client = address(0x2);
    address public agent = address(0x3);
    address public resolver = address(0x4);
    address public feeCollector = address(0x5);

    uint256 public constant PLATFORM_FEE_BPS = 250; // 2.5%
    uint256 public constant DEFAULT_DEADLINE = 30 days;

    event TaskCreated(
        bytes32 indexed taskId,
        address indexed client,
        uint256 payment,
        address token,
        string taskUri,
        uint256 deadline
    );

    event TaskAssigned(
        bytes32 indexed taskId,
        address indexed agent,
        uint256 timestamp
    );

    event TaskCompleted(
        bytes32 indexed taskId,
        address indexed agent,
        uint256 timestamp
    );

    event PaymentReleased(
        bytes32 indexed taskId,
        address indexed agent,
        uint256 amount,
        uint256 fee
    );

    event DisputeRaised(
        bytes32 indexed taskId,
        address indexed initiator,
        string reason,
        uint256 timestamp
    );

    event DisputeResolved(
        bytes32 indexed taskId,
        TaskEscrow.DisputeOutcome outcome,
        uint256 clientShare,
        uint256 agentShare
    );

    function setUp() public {
        vm.startPrank(owner);

        // Deploy mocks
        mockIdentityRegistry = new MockIdentityRegistry();
        mockReputationRegistry = new MockReputationRegistry();

        // Register agent
        mockIdentityRegistry.registerAgentFor(agent, '{"name":"Test Agent"}');

        // Deploy escrow
        escrow = new TaskEscrow(
            address(mockIdentityRegistry),
            address(mockReputationRegistry),
            PLATFORM_FEE_BPS,
            feeCollector,
            DEFAULT_DEADLINE,
            owner
        );

        // Setup resolver
        escrow.setResolver(resolver, true);

        vm.stopPrank();

        // Fund client
        vm.deal(client, 100 ether);
    }

    // ============ Task Creation Tests ============

    function test_CreateTaskWithCelo() public {
        uint256 payment = 1 ether;
        string memory taskUri = "ipfs://QmTest";
        // TaskCreated and TaskAssigned events are emitted
        vm.prank(client);
        bytes32 taskId = escrow.createTaskWithCelo{value: payment}(
            agent,
            taskUri,
            0 // default deadline
        );

        assertTrue(taskId != bytes32(0));

        TaskEscrow.Task memory task = escrow.getTask(taskId);
        assertEq(task.client, client);
        assertEq(task.agent, agent);
        assertEq(task.payment, payment);
        assertEq(task.token, address(0));
        assertEq(uint256(task.status), uint256(TaskEscrow.TaskStatus.Assigned)); // Agent pre-assigned
    }

    function test_CreateTaskWithCelo_OpenTask() public {
        uint256 payment = 1 ether;

        vm.prank(client);
        bytes32 taskId = escrow.createTaskWithCelo{value: payment}(
            address(0), // Open task
            "ipfs://test",
            0
        );

        TaskEscrow.Task memory task = escrow.getTask(taskId);
        assertEq(task.agent, address(0));
        assertEq(uint256(task.status), uint256(TaskEscrow.TaskStatus.Pending));
    }

    function test_RevertWhen_CreateTaskWithZeroPayment() public {
        vm.prank(client);
        vm.expectRevert(
            abi.encodeWithSelector(TaskEscrow.TaskEscrow__InvalidAmount.selector)
        );
        escrow.createTaskWithCelo{value: 0}(agent, "test", 0);
    }

    function test_RevertWhen_CreateTaskWithInvalidDeadline() public {
        vm.prank(client);
        vm.expectRevert(
            abi.encodeWithSelector(TaskEscrow.TaskEscrow__InvalidDeadline.selector)
        );
        escrow.createTaskWithCelo{value: 1 ether}(agent, "test", 1); // Past deadline
    }

    // ============ Task Assignment Tests ============

    function test_AcceptTask() public {
        // Create open task
        vm.prank(client);
        bytes32 taskId = escrow.createTaskWithCelo{value: 1 ether}(
            address(0),
            "test",
            0
        );

        vm.prank(agent);
        escrow.acceptTask(taskId);

        TaskEscrow.Task memory task = escrow.getTask(taskId);
        assertEq(task.agent, agent);
        assertEq(uint256(task.status), uint256(TaskEscrow.TaskStatus.Assigned));
    }

    function test_AssignAgent() public {
        // Create open task
        vm.prank(client);
        bytes32 taskId = escrow.createTaskWithCelo{value: 1 ether}(
            address(0),
            "test",
            0
        );

        vm.prank(client);
        escrow.assignAgent(taskId, agent);

        TaskEscrow.Task memory task = escrow.getTask(taskId);
        assertEq(task.agent, agent);
        assertEq(uint256(task.status), uint256(TaskEscrow.TaskStatus.Assigned));
    }

    function test_RevertWhen_AcceptTask_NotRegistered() public {
        address unregistered = address(0x6);

        vm.prank(client);
        bytes32 taskId = escrow.createTaskWithCelo{value: 1 ether}(
            address(0),
            "test",
            0
        );

        vm.prank(unregistered);
        vm.expectRevert(
            abi.encodeWithSelector(TaskEscrow.TaskEscrow__AgentNotRegistered.selector)
        );
        escrow.acceptTask(taskId);
    }

    // ============ Task Completion Tests ============

    function test_CompleteTask() public {
        vm.prank(client);
        bytes32 taskId = escrow.createTaskWithCelo{value: 1 ether}(agent, "test", 0);

        vm.prank(agent);
        escrow.completeTask(taskId);

        TaskEscrow.Task memory task = escrow.getTask(taskId);
        assertEq(uint256(task.status), uint256(TaskEscrow.TaskStatus.Completed));
    }

    function test_ReleasePayment() public {
        uint256 payment = 1 ether;
        uint256 expectedFee = (payment * PLATFORM_FEE_BPS) / 10000;
        uint256 expectedAgentPayment = payment - expectedFee;

        vm.prank(client);
        bytes32 taskId = escrow.createTaskWithCelo{value: payment}(agent, "test", 0);

        vm.prank(agent);
        escrow.completeTask(taskId);

        uint256 agentBalanceBefore = agent.balance;
        uint256 feeCollectorBalanceBefore = feeCollector.balance;

        vm.prank(client);
        escrow.releasePayment(taskId);

        assertEq(agent.balance, agentBalanceBefore + expectedAgentPayment);
        assertEq(feeCollector.balance, feeCollectorBalanceBefore + expectedFee);

        TaskEscrow.Task memory task = escrow.getTask(taskId);
        assertEq(uint256(task.status), uint256(TaskEscrow.TaskStatus.Released));
    }

    function test_ClaimPayment_AfterTimeout() public {
        uint256 payment = 1 ether;

        vm.prank(client);
        bytes32 taskId = escrow.createTaskWithCelo{value: payment}(agent, "test", 0);

        vm.prank(agent);
        escrow.completeTask(taskId);

        // Move past timeout
        vm.warp(block.timestamp + 7 days + 1);

        uint256 agentBalanceBefore = agent.balance;

        vm.prank(agent);
        escrow.claimPayment(taskId);

        uint256 expectedFee = (payment * PLATFORM_FEE_BPS) / 10000;
        assertEq(agent.balance, agentBalanceBefore + payment - expectedFee);
    }

    // ============ Cancellation Tests ============

    function test_CancelTask_Pending() public {
        vm.prank(client);
        bytes32 taskId = escrow.createTaskWithCelo{value: 1 ether}(agent, "test", 0);

        uint256 clientBalanceBefore = client.balance;

        vm.prank(client);
        escrow.cancelTask(taskId, "No longer needed");

        TaskEscrow.Task memory task = escrow.getTask(taskId);
        assertEq(uint256(task.status), uint256(TaskEscrow.TaskStatus.Cancelled));
        assertEq(client.balance, clientBalanceBefore + 1 ether);
    }

    // ============ Dispute Tests ============

    function test_RaiseDispute() public {
        vm.prank(client);
        bytes32 taskId = escrow.createTaskWithCelo{value: 1 ether}(agent, "test", 0);

        vm.prank(agent);
        escrow.completeTask(taskId);

        vm.prank(client);
        escrow.raiseDispute(taskId, "Work not completed properly");

        TaskEscrow.Task memory task = escrow.getTask(taskId);
        assertEq(uint256(task.status), uint256(TaskEscrow.TaskStatus.Disputed));

        TaskEscrow.Dispute memory dispute = escrow.getDispute(taskId);
        assertEq(dispute.initiator, client);
        assertFalse(dispute.resolved);
    }

    function test_ResolveDispute_FavorAgent() public {
        uint256 payment = 1 ether;

        vm.prank(client);
        bytes32 taskId = escrow.createTaskWithCelo{value: payment}(agent, "test", 0);

        vm.prank(agent);
        escrow.completeTask(taskId);

        vm.prank(client);
        escrow.raiseDispute(taskId, "Test dispute");

        uint256 agentBalanceBefore = agent.balance;

        vm.prank(resolver);
        escrow.resolveDispute(
            taskId,
            TaskEscrow.DisputeOutcome.FavorAgent,
            0
        );

        uint256 expectedFee = (payment * PLATFORM_FEE_BPS) / 10000;
        assertEq(agent.balance, agentBalanceBefore + payment - expectedFee);

        TaskEscrow.Task memory task = escrow.getTask(taskId);
        assertEq(uint256(task.status), uint256(TaskEscrow.TaskStatus.Resolved));
    }

    function test_ResolveDispute_FavorClient() public {
        uint256 payment = 1 ether;

        vm.prank(client);
        bytes32 taskId = escrow.createTaskWithCelo{value: payment}(agent, "test", 0);

        vm.prank(agent);
        escrow.completeTask(taskId);

        vm.prank(client);
        escrow.raiseDispute(taskId, "Test dispute");

        uint256 clientBalanceBefore = client.balance;

        vm.prank(resolver);
        escrow.resolveDispute(
            taskId,
            TaskEscrow.DisputeOutcome.FavorClient,
            0
        );

        assertEq(client.balance, clientBalanceBefore + payment);
    }

    function test_ResolveDispute_Split() public {
        uint256 payment = 1 ether;
        uint256 clientShare = 5000; // 50%

        vm.prank(client);
        bytes32 taskId = escrow.createTaskWithCelo{value: payment}(agent, "test", 0);

        vm.prank(agent);
        escrow.completeTask(taskId);

        vm.prank(client);
        escrow.raiseDispute(taskId, "Test dispute");

        uint256 clientBalanceBefore = client.balance;
        uint256 agentBalanceBefore = agent.balance;

        vm.prank(resolver);
        escrow.resolveDispute(
            taskId,
            TaskEscrow.DisputeOutcome.Split,
            clientShare
        );

        assertEq(client.balance, clientBalanceBefore + payment / 2);
        // Agent gets half minus fee
        uint256 expectedFee = ((payment / 2) * PLATFORM_FEE_BPS) / 10000;
        assertEq(agent.balance, agentBalanceBefore + payment / 2 - expectedFee);
    }

    // ============ View Function Tests ============

    function test_GetClientTasks() public {
        vm.startPrank(client);
        bytes32 task1 = escrow.createTaskWithCelo{value: 1 ether}(agent, "test1", 0);
        bytes32 task2 = escrow.createTaskWithCelo{value: 1 ether}(agent, "test2", 0);
        vm.stopPrank();

        bytes32[] memory tasks = escrow.getClientTasks(client);
        assertEq(tasks.length, 2);
        assertEq(tasks[0], task1);
        assertEq(tasks[1], task2);
    }

    function test_GetAgentTasks() public {
        vm.prank(client);
        escrow.createTaskWithCelo{value: 1 ether}(agent, "test", 0);

        bytes32[] memory tasks = escrow.getAgentTasks(agent);
        assertEq(tasks.length, 1);
    }

    function test_TotalTasks() public {
        assertEq(escrow.totalTasks(), 0);

        vm.prank(client);
        escrow.createTaskWithCelo{value: 1 ether}(agent, "test", 0);

        assertEq(escrow.totalTasks(), 1);
    }

    // ============ Admin Function Tests ============

    function test_SetPlatformFee() public {
        uint256 newFee = 300; // 3%

        vm.prank(owner);
        escrow.setPlatformFee(newFee);

        assertEq(escrow.platformFeeBps(), newFee);
    }

    function test_RevertWhen_SetPlatformFee_TooHigh() public {
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(TaskEscrow.TaskEscrow__InvalidAmount.selector)
        );
        escrow.setPlatformFee(600); // > MAX 5%
    }

    function test_Pause() public {
        vm.prank(owner);
        escrow.pause();

        vm.prank(client);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        escrow.createTaskWithCelo{value: 1 ether}(agent, "test", 0);
    }

    // ============ Edge Case Tests ============

    function test_MultipleTasks() public {
        vm.startPrank(client);
        for (uint256 i = 0; i < 5; i++) {
            escrow.createTaskWithCelo{value: 1 ether}(agent, "test", 0);
        }
        vm.stopPrank();

        assertEq(escrow.totalTasks(), 5);
        assertEq(escrow.totalVolume(), 5 ether);
    }

    receive() external payable {}
}
