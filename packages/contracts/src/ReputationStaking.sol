// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IIdentityRegistry.sol";
import "./interfaces/IReputationRegistry.sol";

/**
 * @title ReputationStaking
 * @notice Allows established agents to vouch for new agents by staking CELO
 * @dev Implements reputation-backed lending protocol with cooldown periods
 */
contract ReputationStaking is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ State Variables ============

    /// @notice CELO token contract
    IERC20 public immutable celoToken;

    /// @notice ERC-8004 Identity Registry
    IIdentityRegistry public immutable identityRegistry;

    /// @notice ERC-8004 Reputation Registry
    IReputationRegistry public immutable reputationRegistry;

    /// @notice Minimum reputation score required to vouch
    uint256 public minimumReputationToVouch;

    /// @notice Minimum stake amount in CELO (wei)
    uint256 public minimumStakeAmount;

    /// @notice Cooldown period for unstaking (7 days)
    uint256 public constant COOLDOWN_PERIOD = 7 days;

    /// @notice Basis points for reputation boost on successful task
    uint256 public reputationBoostBps; // e.g., 100 = 1%

    /// @notice Vouching relationship struct
    struct Vouch {
        address voucher;        // Established agent vouching
        address vouchee;        // New agent being vouched for
        uint256 amount;         // CELO staked
        uint256 timestamp;      // When vouch was created
        bool isActive;          // Whether vouch is still active
        uint256 tasksCompleted; // Number of tasks completed under this vouch
    }

    /// @notice Unstake request struct
    struct UnstakeRequest {
        uint256 amount;
        uint256 unlockTime;
        bool executed;
    }

    /// @notice Mapping from vouchee to their vouch
    mapping(address => Vouch) public vouches;

    /// @notice Mapping from voucher to their total staked amount
    mapping(address => uint256) public totalStakedByVoucher;

    /// @notice Mapping from voucher to list of vouchees
    mapping(address => address[]) public voucherVouchees;

    /// @notice Mapping for unstake requests
    mapping(address => UnstakeRequest[]) public unstakeRequests;

    /// @notice Mapping for authorized task completers
    mapping(address => bool) public authorizedTaskCompleters;

    /// @notice Total CELO staked in the contract
    uint256 public totalStaked;

    // ============ Events ============

    event VouchCreated(
        address indexed voucher,
        address indexed vouchee,
        uint256 amount,
        uint256 timestamp
    );

    event VouchIncreased(
        address indexed voucher,
        address indexed vouchee,
        uint256 additionalAmount,
        uint256 newTotal
    );

    event VouchDeactivated(
        address indexed voucher,
        address indexed vouchee,
        string reason
    );

    event UnstakeRequested(
        address indexed voucher,
        uint256 amount,
        uint256 unlockTime,
        uint256 requestIndex
    );

    event UnstakeCompleted(
        address indexed voucher,
        uint256 amount,
        uint256 requestIndex
    );

    event TaskCompleted(
        address indexed vouchee,
        address indexed voucher,
        bool success,
        uint256 reputationDelta
    );

    event MinimumReputationUpdated(uint256 oldValue, uint256 newValue);
    event MinimumStakeUpdated(uint256 oldValue, uint256 newValue);
    event ReputationBoostUpdated(uint256 oldValue, uint256 newValue);
    event TaskCompleterUpdated(address indexed completer, bool isAuthorized);

    // ============ Errors ============

    error ReputationStaking__InsufficientReputation();
    error ReputationStaking__InsufficientStake();
    error ReputationStaking__AlreadyVouched();
    error ReputationStaking__NotVouched();
    error ReputationStaking__VouchNotActive();
    error ReputationStaking__Unauthorized();
    error ReputationStaking__CooldownNotMet();
    error ReputationStaking__InvalidAmount();
    error ReputationStaking__NoPendingUnstake();
    error ReputationStaking__AlreadyExecuted();
    error ReputationStaking__VoucherNotRegistered();
    error ReputationStaking__VoucheeAlreadyRegistered();

    // ============ Modifiers ============

    modifier onlyAuthorizedTaskCompleter() {
        if (!authorizedTaskCompleters[msg.sender] && msg.sender != owner()) {
            revert ReputationStaking__Unauthorized();
        }
        _;
    }

    modifier onlyRegisteredVoucher() {
        if (!identityRegistry.isRegistered(msg.sender)) {
            revert ReputationStaking__VoucherNotRegistered();
        }
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Initialize the ReputationStaking contract
     * @param _celoToken Address of CELO token
     * @param _identityRegistry Address of ERC-8004 Identity Registry
     * @param _reputationRegistry Address of ERC-8004 Reputation Registry
     * @param _minimumReputation Minimum reputation to vouch
     * @param _minimumStake Minimum stake amount
     * @param initialOwner Address of initial owner
     */
    constructor(
        address _celoToken,
        address _identityRegistry,
        address _reputationRegistry,
        uint256 _minimumReputation,
        uint256 _minimumStake,
        address initialOwner
    ) Ownable(initialOwner) {
        celoToken = IERC20(_celoToken);
        identityRegistry = IIdentityRegistry(_identityRegistry);
        reputationRegistry = IReputationRegistry(_reputationRegistry);
        minimumReputationToVouch = _minimumReputation;
        minimumStakeAmount = _minimumStake;
        reputationBoostBps = 100; // Default 1%
    }

    // ============ External Functions ============

    /**
     * @notice Vouch for a new agent by staking CELO
     * @param vouchee Address of the agent to vouch for
     * @param amount Amount of CELO to stake
     */
    function vouchForAgent(
        address vouchee,
        uint256 amount
    ) external nonReentrant whenNotPaused onlyRegisteredVoucher {
        _validateVouch(vouchee, amount);

        // Transfer CELO from voucher
        celoToken.safeTransferFrom(msg.sender, address(this), amount);

        // Create vouch relationship
        vouches[vouchee] = Vouch({
            voucher: msg.sender,
            vouchee: vouchee,
            amount: amount,
            timestamp: block.timestamp,
            isActive: true,
            tasksCompleted: 0
        });

        // Update tracking
        totalStakedByVoucher[msg.sender] += amount;
        voucherVouchees[msg.sender].push(vouchee);
        totalStaked += amount;

        emit VouchCreated(msg.sender, vouchee, amount, block.timestamp);
    }

    /**
     * @notice Increase stake for an existing vouch
     * @param vouchee Address of the vouched agent
     * @param additionalAmount Additional CELO to stake
     */
    function increaseStake(
        address vouchee,
        uint256 additionalAmount
    ) external nonReentrant whenNotPaused {
        Vouch storage vouch = vouches[vouchee];

        if (vouch.voucher != msg.sender) {
            revert ReputationStaking__NotVouched();
        }
        if (!vouch.isActive) {
            revert ReputationStaking__VouchNotActive();
        }
        if (additionalAmount == 0) {
            revert ReputationStaking__InvalidAmount();
        }

        // Transfer additional CELO
        celoToken.safeTransferFrom(msg.sender, address(this), additionalAmount);

        // Update vouch
        vouch.amount += additionalAmount;
        totalStakedByVoucher[msg.sender] += additionalAmount;
        totalStaked += additionalAmount;

        emit VouchIncreased(
            msg.sender,
            vouchee,
            additionalAmount,
            vouch.amount
        );
    }

    /**
     * @notice Request to unstake CELO (starts cooldown)
     * @param amount Amount to unstake
     */
    function requestUnstake(
        uint256 amount
    ) external nonReentrant whenNotPaused {
        if (amount == 0) {
            revert ReputationStaking__InvalidAmount();
        }
        if (totalStakedByVoucher[msg.sender] < amount) {
            revert ReputationStaking__InsufficientStake();
        }

        uint256 requestIndex = unstakeRequests[msg.sender].length;
        uint256 unlockTime = block.timestamp + COOLDOWN_PERIOD;

        unstakeRequests[msg.sender].push(
            UnstakeRequest({
                amount: amount,
                unlockTime: unlockTime,
                executed: false
            })
        );

        // Deactivate affected vouches if needed
        _deactivateVouchesForUnstake(msg.sender, amount);

        emit UnstakeRequested(msg.sender, amount, unlockTime, requestIndex);
    }

    /**
     * @notice Complete unstake after cooldown period
     * @param requestIndex Index of the unstake request
     */
    function completeUnstake(
        uint256 requestIndex
    ) external nonReentrant {
        UnstakeRequest storage request = unstakeRequests[msg.sender][requestIndex];

        if (request.executed) {
            revert ReputationStaking__AlreadyExecuted();
        }
        if (block.timestamp < request.unlockTime) {
            revert ReputationStaking__CooldownNotMet();
        }

        request.executed = true;
        totalStakedByVoucher[msg.sender] -= request.amount;
        totalStaked -= request.amount;

        // Transfer CELO back to voucher
        celoToken.safeTransfer(msg.sender, request.amount);

        emit UnstakeCompleted(msg.sender, request.amount, requestIndex);
    }

    /**
     * @notice Record task completion for a vouched agent
     * @param vouchee Address of the vouched agent
     * @param success Whether the task was completed successfully
     */
    function recordTaskCompletion(
        address vouchee,
        bool success
    ) external onlyAuthorizedTaskCompleter {
        Vouch storage vouch = vouches[vouchee];

        if (!vouch.isActive) {
            revert ReputationStaking__VouchNotActive();
        }

        vouch.tasksCompleted++;

        // Update reputation based on outcome
        if (success) {
            uint256 reputationDelta = _calculateReputationBoost(vouch.amount);
            reputationRegistry.updateReputation(
                vouch.voucher,
                int256(reputationDelta),
                "Task completion reward"
            );
            reputationRegistry.recordTaskCompletion(vouchee, true);
        } else {
            reputationRegistry.recordTaskCompletion(vouchee, false);
        }

        emit TaskCompleted(vouchee, vouch.voucher, success, success ? _calculateReputationBoost(vouch.amount) : 0);
    }

    /**
     * @notice Deactivate a vouch (admin or voucher only)
     * @param vouchee Address of the vouched agent
     * @param reason Reason for deactivation
     */
    function deactivateVouch(
        address vouchee,
        string calldata reason
    ) external {
        Vouch storage vouch = vouches[vouchee];

        if (vouch.voucher != msg.sender && msg.sender != owner()) {
            revert ReputationStaking__Unauthorized();
        }
        if (!vouch.isActive) {
            revert ReputationStaking__VouchNotActive();
        }

        vouch.isActive = false;

        emit VouchDeactivated(vouch.voucher, vouchee, reason);
    }

    // ============ View Functions ============

    /**
     * @notice Get vouch information
     * @param vouchee Address of the vouched agent
     */
    function getVouch(
        address vouchee
    )
        external
        view
        returns (
            address voucher,
            uint256 amount,
            uint256 timestamp,
            bool isActive,
            uint256 tasksCompleted
        )
    {
        Vouch storage vouch = vouches[vouchee];
        return (
            vouch.voucher,
            vouch.amount,
            vouch.timestamp,
            vouch.isActive,
            vouch.tasksCompleted
        );
    }

    /**
     * @notice Get all vouchees for a voucher
     * @param voucher Address of the voucher
     */
    function getVoucherVouchees(
        address voucher
    ) external view returns (address[] memory) {
        return voucherVouchees[voucher];
    }

    /**
     * @notice Get unstake request details
     * @param voucher Address of the voucher
     * @param index Request index
     */
    function getUnstakeRequest(
        address voucher,
        uint256 index
    ) external view returns (UnstakeRequest memory) {
        return unstakeRequests[voucher][index];
    }

    /**
     * @notice Check if voucher can vouch (has sufficient reputation)
     * @param voucher Address to check
     */
    function canVouch(address voucher) external view returns (bool) {
        return reputationRegistry.hasMinimumReputation(
            voucher,
            minimumReputationToVouch
        );
    }

    /**
     * @notice Get number of pending unstake requests
     * @param voucher Address of the voucher
     */
    function getPendingUnstakeCount(
        address voucher
    ) external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < unstakeRequests[voucher].length; i++) {
            if (!unstakeRequests[voucher][i].executed) {
                count++;
            }
        }
        return count;
    }

    // ============ Admin Functions ============

    /**
     * @notice Update minimum reputation required to vouch
     */
    function setMinimumReputation(
        uint256 newMinimum
    ) external onlyOwner {
        emit MinimumReputationUpdated(minimumReputationToVouch, newMinimum);
        minimumReputationToVouch = newMinimum;
    }

    /**
     * @notice Update minimum stake amount
     */
    function setMinimumStake(
        uint256 newMinimum
    ) external onlyOwner {
        emit MinimumStakeUpdated(minimumStakeAmount, newMinimum);
        minimumStakeAmount = newMinimum;
    }

    /**
     * @notice Update reputation boost basis points
     */
    function setReputationBoostBps(
        uint256 newBps
    ) external onlyOwner {
        emit ReputationBoostUpdated(reputationBoostBps, newBps);
        reputationBoostBps = newBps;
    }

    /**
     * @notice Set authorized task completer
     */
    function setAuthorizedTaskCompleter(
        address completer,
        bool isAuthorized
    ) external onlyOwner {
        authorizedTaskCompleters[completer] = isAuthorized;
        emit TaskCompleterUpdated(completer, isAuthorized);
    }

    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ Internal Functions ============

    /**
     * @notice Validate vouch parameters
     */
    function _validateVouch(
        address vouchee,
        uint256 amount
    ) internal view {
        if (amount < minimumStakeAmount) {
            revert ReputationStaking__InsufficientStake();
        }
        if (vouches[vouchee].isActive) {
            revert ReputationStaking__AlreadyVouched();
        }
        if (identityRegistry.isRegistered(vouchee)) {
            revert ReputationStaking__VoucheeAlreadyRegistered();
        }
        if (
            !reputationRegistry.hasMinimumReputation(
                msg.sender,
                minimumReputationToVouch
            )
        ) {
            revert ReputationStaking__InsufficientReputation();
        }
    }

    /**
     * @notice Calculate reputation boost based on stake amount
     */
    function _calculateReputationBoost(
        uint256 stakeAmount
    ) internal view returns (uint256) {
        return (stakeAmount * reputationBoostBps) / 10000;
    }

    /**
     * @notice Deactivate vouches when unstaking
     */
    function _deactivateVouchesForUnstake(
        address voucher,
        uint256 amount
    ) internal {
        uint256 remainingToDeactivate = amount;
        address[] storage vouchees = voucherVouchees[voucher];

        for (uint256 i = 0; i < vouchees.length && remainingToDeactivate > 0; i++) {
            Vouch storage vouch = vouches[vouchees[i]];
            if (vouch.isActive && vouch.amount <= remainingToDeactivate) {
                vouch.isActive = false;
                remainingToDeactivate -= vouch.amount;
                emit VouchDeactivated(voucher, vouchees[i], "Unstake request");
            }
        }
    }
}
