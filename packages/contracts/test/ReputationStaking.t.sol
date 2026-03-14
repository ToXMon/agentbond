// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/ReputationStaking.sol";
import "./AgentRegistry.t.sol";

contract MockReputationRegistry is IReputationRegistry {
    mapping(address => ReputationData) private reputations;
    address[] private allAgents;

    function setReputation(address agent, uint256 score) external {
        reputations[agent].score = score;
        reputations[agent].lastUpdated = block.timestamp;
        if (reputations[agent].totalStaked == 0) {
            allAgents.push(agent);
        }
    }

    function getReputation(address agent) external view override returns (ReputationData memory) {
        return reputations[agent];
    }

    function getScore(address agent) external view override returns (uint256) {
        return reputations[agent].score;
    }

    function getTotalStaked(address agent) external view override returns (uint256) {
        return reputations[agent].totalStaked;
    }

    function getTasksCompleted(address agent) external view override returns (uint256) {
        return reputations[agent].tasksCompleted;
    }

    function isVerified(address agent) external view override returns (bool) {
        return reputations[agent].isVerified;
    }

    function hasMinimumReputation(address agent, uint256 threshold) external view override returns (bool) {
        return reputations[agent].score >= threshold;
    }

    function updateReputation(address agent, int256 delta, string calldata reason) external override {
        uint256 oldScore = reputations[agent].score;
        if (delta >= 0) {
            reputations[agent].score += uint256(delta);
        } else {
            uint256 decrease = uint256(-delta);
            if (reputations[agent].score >= decrease) {
                reputations[agent].score -= decrease;
            } else {
                reputations[agent].score = 0;
            }
        }
        reputations[agent].lastUpdated = block.timestamp;
        emit ReputationUpdated(agent, reputations[agent].score, oldScore, reason);
    }

    function recordTaskCompletion(address agent, bool success) external override {
        if (success) {
            reputations[agent].tasksCompleted++;
        } else {
            reputations[agent].tasksFailed++;
        }
    }

    function stakeReputation(address) external payable override { revert("Not implemented"); }
    function unstakeReputation(uint256) external override { revert("Not implemented"); }
    function slashReputation(address, uint256, string calldata) external override { revert("Not implemented"); }
    function verifyAgent(address agent) external override { reputations[agent].isVerified = true; }
    function revokeVerification(address agent) external override { reputations[agent].isVerified = false; }
    function getTopAgents(uint256 limit) external view override returns (address[] memory, uint256[] memory) {
        uint256 len = allAgents.length < limit ? allAgents.length : limit;
        address[] memory agents = new address[](len);
        uint256[] memory scores = new uint256[](len);
        for (uint256 i = 0; i < len; i++) {
            agents[i] = allAgents[i];
            scores[i] = reputations[allAgents[i]].score;
        }
        return (agents, scores);
    }
}

contract MockERC20 is IERC20 {
    string public name = "CELO";
    string public symbol = "CELO";
    uint8 public decimals = 18;
    uint256 public override totalSupply;
    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allowances;

    function mint(address to, uint256 amount) external {
        balances[to] += amount;
        totalSupply += amount;
    }

    function balanceOf(address account) external view override returns (uint256) {
        return balances[account];
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function allowance(address owner, address spender) external view override returns (uint256) {
        return allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        require(balances[from] >= amount, "Insufficient balance");
        require(allowances[from][msg.sender] >= amount, "Insufficient allowance");
        balances[from] -= amount;
        allowances[from][msg.sender] -= amount;
        balances[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}

contract ReputationStakingTest is Test {
    ReputationStaking public staking;
    MockIdentityRegistry public mockIdentityRegistry;
    MockReputationRegistry public mockReputationRegistry;
    MockERC20 public mockCelo;

    address public owner = address(0x1);
    address public voucher = address(0x2);
    address public vouchee = address(0x3);
    address public taskCompleter = address(0x4);

    uint256 public constant MIN_REPUTATION = 100;
    uint256 public constant MIN_STAKE = 1e18;
    uint256 public constant VOUCHER_REPUTATION = 500;

    event VouchCreated(address indexed voucher, address indexed vouchee, uint256 amount, uint256 timestamp);
    event UnstakeRequested(address indexed voucher, uint256 amount, uint256 unlockTime, uint256 requestIndex);
    event TaskCompleted(address indexed vouchee, address indexed voucher, bool success, uint256 reputationDelta);

    function setUp() public {
        vm.startPrank(owner);
        mockIdentityRegistry = new MockIdentityRegistry();
        mockReputationRegistry = new MockReputationRegistry();
        mockCelo = new MockERC20();
        mockIdentityRegistry.registerAgentFor(voucher, '{"name":"Voucher"}');
        mockReputationRegistry.setReputation(voucher, VOUCHER_REPUTATION);
        staking = new ReputationStaking(
            address(mockCelo),
            address(mockIdentityRegistry),
            address(mockReputationRegistry),
            MIN_REPUTATION,
            MIN_STAKE,
            owner
        );
        staking.setAuthorizedTaskCompleter(taskCompleter, true);
        vm.stopPrank();
        mockCelo.mint(voucher, 100 * 1e18);
        vm.prank(voucher);
        mockCelo.approve(address(staking), type(uint256).max);
    }

    function test_VouchForAgent() public {
        uint256 stakeAmount = 5 * 1e18;
        vm.prank(voucher);
        staking.vouchForAgent(vouchee, stakeAmount);

        (address returnedVoucher, uint256 vouchAmount, uint256 timestamp, bool isActive, uint256 tasksCompleted) = staking.getVouch(vouchee);
        assertEq(returnedVoucher, voucher);
        assertEq(vouchAmount, stakeAmount);
        assertGt(timestamp, 0);
        assertTrue(isActive);
        assertEq(tasksCompleted, 0);
    }

    function test_RevertWhen_InsufficientReputation() public {
        address lowRepVoucher = address(0x5);
        mockIdentityRegistry.registerAgentFor(lowRepVoucher, '{"name":"Low Rep"}');
        mockReputationRegistry.setReputation(lowRepVoucher, MIN_REPUTATION - 1);
        mockCelo.mint(lowRepVoucher, 10 * 1e18);
        vm.prank(lowRepVoucher);
        mockCelo.approve(address(staking), type(uint256).max);

        vm.prank(lowRepVoucher);
        vm.expectRevert(abi.encodeWithSelector(ReputationStaking.ReputationStaking__InsufficientReputation.selector));
        staking.vouchForAgent(vouchee, MIN_STAKE);
    }

    function test_RevertWhen_InsufficientStake() public {
        vm.prank(voucher);
        vm.expectRevert(abi.encodeWithSelector(ReputationStaking.ReputationStaking__InsufficientStake.selector));
        staking.vouchForAgent(vouchee, MIN_STAKE - 1);
    }

    function test_RevertWhen_AlreadyVouched() public {
        vm.prank(voucher);
        staking.vouchForAgent(vouchee, MIN_STAKE);

        vm.prank(voucher);
        vm.expectRevert(abi.encodeWithSelector(ReputationStaking.ReputationStaking__AlreadyVouched.selector));
        staking.vouchForAgent(vouchee, MIN_STAKE);
    }

    function test_IncreaseStake() public {
        uint256 initialStake = 5 * 1e18;
        uint256 additionalStake = 3 * 1e18;

        vm.startPrank(voucher);
        staking.vouchForAgent(vouchee, initialStake);
        staking.increaseStake(vouchee, additionalStake);
        vm.stopPrank();

        (, uint256 vouchAmount, , , ) = staking.getVouch(vouchee);
        assertEq(vouchAmount, initialStake + additionalStake);
    }

    function test_RequestUnstake() public {
        uint256 stakeAmount = 5 * 1e18;
        vm.prank(voucher);
        staking.vouchForAgent(vouchee, stakeAmount);

        vm.prank(voucher);
        staking.requestUnstake(stakeAmount);

        ReputationStaking.UnstakeRequest memory request = staking.getUnstakeRequest(voucher, 0);
        assertEq(request.amount, stakeAmount);
        assertEq(request.unlockTime, block.timestamp + 7 days);
        assertFalse(request.executed);
    }

    function test_CompleteUnstake_AfterCooldown() public {
        uint256 stakeAmount = 5 * 1e18;
        vm.prank(voucher);
        staking.vouchForAgent(vouchee, stakeAmount);

        vm.prank(voucher);
        staking.requestUnstake(stakeAmount);

        vm.warp(block.timestamp + 7 days + 1);
        uint256 balanceBefore = mockCelo.balanceOf(voucher);

        vm.prank(voucher);
        staking.completeUnstake(0);

        assertEq(mockCelo.balanceOf(voucher), balanceBefore + stakeAmount);
    }

    function test_RevertWhen_CompleteUnstake_BeforeCooldown() public {
        uint256 stakeAmount = 5 * 1e18;
        vm.prank(voucher);
        staking.vouchForAgent(vouchee, stakeAmount);

        vm.prank(voucher);
        staking.requestUnstake(stakeAmount);

        vm.prank(voucher);
        vm.expectRevert(abi.encodeWithSelector(ReputationStaking.ReputationStaking__CooldownNotMet.selector));
        staking.completeUnstake(0);
    }

    function test_RecordTaskCompletion_Success() public {
        uint256 stakeAmount = 5 * 1e18;
        vm.prank(voucher);
        staking.vouchForAgent(vouchee, stakeAmount);

        vm.prank(taskCompleter);
        staking.recordTaskCompletion(vouchee, true);

        (, , , , uint256 tasksCompleted) = staking.getVouch(vouchee);
        assertEq(tasksCompleted, 1);
    }

    function test_RecordTaskCompletion_UpdatesReputation() public {
        uint256 stakeAmount = 5 * 1e18;
        vm.prank(voucher);
        staking.vouchForAgent(vouchee, stakeAmount);

        uint256 reputationBefore = mockReputationRegistry.getScore(voucher);

        vm.prank(taskCompleter);
        staking.recordTaskCompletion(vouchee, true);

        uint256 reputationAfter = mockReputationRegistry.getScore(voucher);
        assertGt(reputationAfter, reputationBefore);
    }

    function test_CanVouch() public view {
        assertTrue(staking.canVouch(voucher));
    }

    function test_GetVoucherVouchees() public {
        address vouchee2 = address(0x6);
        vm.startPrank(voucher);
        staking.vouchForAgent(vouchee, MIN_STAKE);
        staking.vouchForAgent(vouchee2, MIN_STAKE);
        vm.stopPrank();

        address[] memory vouchees = staking.getVoucherVouchees(voucher);
        assertEq(vouchees.length, 2);
    }

    function test_SetMinimumReputation() public {
        uint256 newMin = 200;
        vm.prank(owner);
        staking.setMinimumReputation(newMin);
        assertEq(staking.minimumReputationToVouch(), newMin);
    }

    function test_Pause() public {
        vm.prank(owner);
        staking.pause();

        vm.prank(voucher);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        staking.vouchForAgent(vouchee, MIN_STAKE);
    }
}
