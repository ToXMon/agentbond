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
 * @title TaskEscrow
 * @notice Handles x402-style payments for agent tasks with escrow and dispute resolution
 * @dev Manages task lifecycle from creation to completion or dispute
 */
contract TaskEscrow is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Enums ============

    enum TaskStatus {
        Pending,      // Task created, waiting for agent
        Assigned,     // Agent assigned, work in progress
        Completed,    // Task completed, payment pending
        Released,     // Payment released to agent
        Disputed,     // Dispute raised
        Resolved,     // Dispute resolved
        Cancelled,    // Task cancelled
        Expired       // Task expired
    }

    enum DisputeOutcome {
        None,         // No dispute
        FavorClient,  // Client wins - refund
        FavorAgent,   // Agent wins - payment released
        Split         // Split between parties
    }

    // ============ Structs ============

    struct Task {
        bytes32 taskId;           // Unique task identifier
        address client;           // Task creator
        address agent;            // Assigned agent
        uint256 payment;          // Payment amount
        address token;            // Payment token (address(0) for CELO/native)
        string taskUri;           // URI to task details (off-chain)
        uint256 createdAt;        // Creation timestamp
        uint256 assignedAt;       // Assignment timestamp
        uint256 completedAt;      // Completion timestamp
        uint256 deadline;         // Task deadline
        TaskStatus status;        // Current status
        DisputeOutcome disputeOutcome;
        uint256 disputeTimestamp;
        string disputeReason;
    }

    struct Dispute {
        bytes32 taskId;
        address initiator;
        string reason;
        uint256 timestamp;
        bool resolved;
        DisputeOutcome outcome;
        uint256 clientShare;      // Basis points for client (e.g., 5000 = 50%)
    }

    // ============ State Variables ============

    /// @notice CELO token contract (for CELO payments)
    address public constant CELO_TOKEN = address(0);

    /// @notice ERC-8004 Identity Registry
    IIdentityRegistry public immutable identityRegistry;

    /// @notice ERC-8004 Reputation Registry
    IReputationRegistry public immutable reputationRegistry;

    /// @notice Platform fee basis points (e.g., 250 = 2.5%)
    uint256 public platformFeeBps;

    /// @notice Maximum platform fee (5%)
    uint256 public constant MAX_PLATFORM_FEE_BPS = 500;

    /// @notice Dispute resolution period (3 days)
    uint256 public constant DISPUTE_PERIOD = 3 days;

    /// @notice Task completion timeout (7 days to claim after completion)
    uint256 public constant COMPLETION_TIMEOUT = 7 days;

    /// @notice Default task deadline (30 days)
    uint256 public defaultDeadline;

    /// @notice Fee collector address
    address public feeCollector;

    /// @notice Mapping from task ID to Task struct
    mapping(bytes32 => Task) public tasks;

    /// @notice Mapping from task ID to Dispute struct
    mapping(bytes32 => Dispute) public disputes;

    /// @notice Mapping from client to their task IDs
    mapping(address => bytes32[]) public clientTasks;

    /// @notice Mapping from agent to their assigned task IDs
    mapping(address => bytes32[]) public agentTasks;

    /// @notice Mapping for supported payment tokens
    mapping(address => bool) public supportedTokens;

    /// @notice Authorized dispute resolvers
    mapping(address => bool) public authorizedResolvers;

    /// @notice Total tasks created
    uint256 public totalTasks;

    /// @notice Total payment volume (in CELO equivalent)
    uint256 public totalVolume;

    // ============ Events ============

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

    event PaymentRefunded(
        bytes32 indexed taskId,
        address indexed client,
        uint256 amount
    );

    event DisputeRaised(
        bytes32 indexed taskId,
        address indexed initiator,
        string reason,
        uint256 timestamp
    );

    event DisputeResolved(
        bytes32 indexed taskId,
        DisputeOutcome outcome,
        uint256 clientShare,
        uint256 agentShare
    );

    event TaskCancelled(
        bytes32 indexed taskId,
        address indexed by,
        string reason
    );

    event TaskExpired(
        bytes32 indexed taskId,
        uint256 timestamp
    );

    event PlatformFeeUpdated(uint256 oldValue, uint256 newValue);
    event FeeCollectorUpdated(address indexed oldValue, address indexed newValue);
    event SupportedTokenUpdated(address indexed token, bool isSupported);
    event ResolverUpdated(address indexed resolver, bool isAuthorized);

    // ============ Errors ============

    error TaskEscrow__TaskNotFound();
    error TaskEscrow__InvalidStatus();
    error TaskEscrow__Unauthorized();
    error TaskEscrow__InvalidAmount();
    error TaskEscrow__InvalidDeadline();
    error TaskEscrow__TokenNotSupported();
    error TaskEscrow__AgentNotRegistered();
    error TaskEscrow__TaskExpired();
    error TaskEscrow__DisputePeriodElapsed();
    error TaskEscrow__AlreadyDisputed();
    error TaskEscrow__NotDisputed();
    error TaskEscrow__DisputeAlreadyResolved();
    error TaskEscrow__InvalidDisputeOutcome();
    error TaskEscrow__TransferFailed();

    // ============ Modifiers ============

    modifier onlyClient(bytes32 taskId) {
        if (tasks[taskId].client != msg.sender) {
            revert TaskEscrow__Unauthorized();
        }
        _;
    }

    modifier onlyAgent(bytes32 taskId) {
        if (tasks[taskId].agent != msg.sender) {
            revert TaskEscrow__Unauthorized();
        }
        _;
    }

    modifier onlyResolver() {
        if (!authorizedResolvers[msg.sender] && msg.sender != owner()) {
            revert TaskEscrow__Unauthorized();
        }
        _;
    }

    modifier taskExists(bytes32 taskId) {
        if (tasks[taskId].taskId == bytes32(0)) {
            revert TaskEscrow__TaskNotFound();
        }
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Initialize the TaskEscrow contract
     * @param _identityRegistry Address of ERC-8004 Identity Registry
     * @param _reputationRegistry Address of ERC-8004 Reputation Registry
     * @param _platformFeeBps Platform fee in basis points
     * @param _feeCollector Address to collect fees
     * @param _defaultDeadline Default task deadline in seconds
     * @param initialOwner Address of initial owner
     */
    constructor(
        address _identityRegistry,
        address _reputationRegistry,
        uint256 _platformFeeBps,
        address _feeCollector,
        uint256 _defaultDeadline,
        address initialOwner
    ) Ownable(initialOwner) {
        identityRegistry = IIdentityRegistry(_identityRegistry);
        reputationRegistry = IReputationRegistry(_reputationRegistry);
        platformFeeBps = _platformFeeBps;
        feeCollector = _feeCollector;
        defaultDeadline = _defaultDeadline;
        
        // CELO is always supported
        supportedTokens[CELO_TOKEN] = true;
    }

    // ============ External Functions - Task Lifecycle ============

    /**
     * @notice Create a new task with CELO payment
     * @param agent Address of the assigned agent (address(0) for open task)
     * @param taskUri URI to task details
     * @param deadline Task deadline (0 for default)
     */
    function createTaskWithCelo(
        address agent,
        string calldata taskUri,
        uint256 deadline
    ) external payable nonReentrant whenNotPaused returns (bytes32 taskId) {
        return _createTask(agent, msg.value, CELO_TOKEN, taskUri, deadline);
    }

    /**
     * @notice Create a new task with ERC20 payment
     * @param agent Address of the assigned agent
     * @param payment Payment amount
     * @param token Payment token address
     * @param taskUri URI to task details
     * @param deadline Task deadline
     */
    function createTaskWithToken(
        address agent,
        uint256 payment,
        address token,
        string calldata taskUri,
        uint256 deadline
    ) external nonReentrant whenNotPaused returns (bytes32 taskId) {
        if (!supportedTokens[token]) {
            revert TaskEscrow__TokenNotSupported();
        }

        IERC20(token).safeTransferFrom(msg.sender, address(this), payment);
        return _createTask(agent, payment, token, taskUri, deadline);
    }

    /**
     * @notice Assign an agent to a task (client only)
     * @param taskId Task identifier
     * @param agent Agent address to assign
     */
    function assignAgent(
        bytes32 taskId,
        address agent
    ) external taskExists(taskId) onlyClient(taskId) nonReentrant {
        Task storage task = tasks[taskId];

        if (task.status != TaskStatus.Pending) {
            revert TaskEscrow__InvalidStatus();
        }
        if (!identityRegistry.isRegistered(agent)) {
            revert TaskEscrow__AgentNotRegistered();
        }
        if (block.timestamp > task.deadline) {
            revert TaskEscrow__TaskExpired();
        }

        task.agent = agent;
        task.assignedAt = block.timestamp;
        task.status = TaskStatus.Assigned;

        agentTasks[agent].push(taskId);

        emit TaskAssigned(taskId, agent, block.timestamp);
    }

    /**
     * @notice Agent accepts an open task
     * @param taskId Task identifier
     */
    function acceptTask(
        bytes32 taskId
    ) external taskExists(taskId) nonReentrant {
        Task storage task = tasks[taskId];

        if (task.status != TaskStatus.Pending) {
            revert TaskEscrow__InvalidStatus();
        }
        if (task.agent != address(0)) {
            revert TaskEscrow__Unauthorized();
        }
        if (!identityRegistry.isRegistered(msg.sender)) {
            revert TaskEscrow__AgentNotRegistered();
        }
        if (block.timestamp > task.deadline) {
            revert TaskEscrow__TaskExpired();
        }

        task.agent = msg.sender;
        task.assignedAt = block.timestamp;
        task.status = TaskStatus.Assigned;

        agentTasks[msg.sender].push(taskId);

        emit TaskAssigned(taskId, msg.sender, block.timestamp);
    }

    /**
     * @notice Mark task as completed (agent only)
     * @param taskId Task identifier
     */
    function completeTask(
        bytes32 taskId
    ) external taskExists(taskId) onlyAgent(taskId) nonReentrant {
        Task storage task = tasks[taskId];

        if (task.status != TaskStatus.Assigned) {
            revert TaskEscrow__InvalidStatus();
        }

        task.completedAt = block.timestamp;
        task.status = TaskStatus.Completed;

        // Record task completion for reputation
        reputationRegistry.recordTaskCompletion(task.agent, true);

        emit TaskCompleted(taskId, task.agent, block.timestamp);
    }

    /**
     * @notice Release payment to agent (client only)
     * @param taskId Task identifier
     */
    function releasePayment(
        bytes32 taskId
    ) external taskExists(taskId) onlyClient(taskId) nonReentrant {
        Task storage task = tasks[taskId];

        if (task.status != TaskStatus.Completed) {
            revert TaskEscrow__InvalidStatus();
        }

        task.status = TaskStatus.Released;
        _releasePayment(taskId, task.agent, task.payment, task.token);
    }

    /**
     * @notice Claim payment after timeout (agent only)
     * @param taskId Task identifier
     */
    function claimPayment(
        bytes32 taskId
    ) external taskExists(taskId) onlyAgent(taskId) nonReentrant {
        Task storage task = tasks[taskId];

        if (task.status != TaskStatus.Completed) {
            revert TaskEscrow__InvalidStatus();
        }
        if (block.timestamp < task.completedAt + COMPLETION_TIMEOUT) {
            revert TaskEscrow__DisputePeriodElapsed();
        }

        task.status = TaskStatus.Released;
        _releasePayment(taskId, task.agent, task.payment, task.token);
    }

    /**
     * @notice Cancel task (client only, before assignment)
     * @param taskId Task identifier
     * @param reason Cancellation reason
     */
    function cancelTask(
        bytes32 taskId,
        string calldata reason
    ) external taskExists(taskId) onlyClient(taskId) nonReentrant {
        Task storage task = tasks[taskId];

        if (task.status != TaskStatus.Pending && task.status != TaskStatus.Assigned) {
            revert TaskEscrow__InvalidStatus();
        }

        task.status = TaskStatus.Cancelled;
        _refundPayment(taskId, task.client, task.payment, task.token);

        emit TaskCancelled(taskId, msg.sender, reason);
    }

    // ============ External Functions - Dispute Resolution ============

    /**
     * @notice Raise a dispute
     * @param taskId Task identifier
     * @param reason Dispute reason
     */
    function raiseDispute(
        bytes32 taskId,
        string calldata reason
    ) external taskExists(taskId) nonReentrant {
        Task storage task = tasks[taskId];

        if (msg.sender != task.client && msg.sender != task.agent) {
            revert TaskEscrow__Unauthorized();
        }
        if (task.status != TaskStatus.Assigned && task.status != TaskStatus.Completed) {
            revert TaskEscrow__InvalidStatus();
        }
        if (disputes[taskId].timestamp != 0) {
            revert TaskEscrow__AlreadyDisputed();
        }
        if (task.status == TaskStatus.Completed && 
            block.timestamp > task.completedAt + DISPUTE_PERIOD) {
            revert TaskEscrow__DisputePeriodElapsed();
        }

        task.status = TaskStatus.Disputed;
        task.disputeTimestamp = block.timestamp;

        disputes[taskId] = Dispute({
            taskId: taskId,
            initiator: msg.sender,
            reason: reason,
            timestamp: block.timestamp,
            resolved: false,
            outcome: DisputeOutcome.None,
            clientShare: 0
        });

        emit DisputeRaised(taskId, msg.sender, reason, block.timestamp);
    }

    /**
     * @notice Resolve a dispute (authorized resolvers only)
     * @param taskId Task identifier
     * @param outcome Dispute outcome
     * @param clientShare Client's share in basis points (for split outcome)
     */
    function resolveDispute(
        bytes32 taskId,
        DisputeOutcome outcome,
        uint256 clientShare
    ) external taskExists(taskId) onlyResolver nonReentrant {
        Task storage task = tasks[taskId];
        Dispute storage dispute = disputes[taskId];

        if (task.status != TaskStatus.Disputed) {
            revert TaskEscrow__NotDisputed();
        }
        if (dispute.resolved) {
            revert TaskEscrow__DisputeAlreadyResolved();
        }
        if (outcome == DisputeOutcome.None) {
            revert TaskEscrow__InvalidDisputeOutcome();
        }

        dispute.resolved = true;
        dispute.outcome = outcome;
        dispute.clientShare = clientShare;
        task.status = TaskStatus.Resolved;
        task.disputeOutcome = outcome;

        uint256 clientAmount;
        uint256 agentAmount;

        if (outcome == DisputeOutcome.FavorClient) {
            clientAmount = task.payment;
            _refundPayment(taskId, task.client, clientAmount, task.token);
            reputationRegistry.recordTaskCompletion(task.agent, false);
        } else if (outcome == DisputeOutcome.FavorAgent) {
            agentAmount = task.payment;
            _releasePayment(taskId, task.agent, agentAmount, task.token);
        } else if (outcome == DisputeOutcome.Split) {
            clientAmount = (task.payment * clientShare) / 10000;
            agentAmount = task.payment - clientAmount;
            
            if (clientAmount > 0) {
                _transferToken(task.client, clientAmount, task.token);
            }
            if (agentAmount > 0) {
                uint256 fee = (agentAmount * platformFeeBps) / 10000;
                _transferToken(feeCollector, fee, task.token);
                _transferToken(task.agent, agentAmount - fee, task.token);
            }
        }

        emit DisputeResolved(taskId, outcome, clientAmount, agentAmount);
    }

    // ============ View Functions ============

    /**
     * @notice Get task details
     * @param taskId Task identifier
     */
    function getTask(
        bytes32 taskId
    ) external view returns (Task memory) {
        return tasks[taskId];
    }

    /**
     * @notice Get dispute details
     * @param taskId Task identifier
     */
    function getDispute(
        bytes32 taskId
    ) external view returns (Dispute memory) {
        return disputes[taskId];
    }

    /**
     * @notice Get client's tasks
     * @param client Client address
     */
    function getClientTasks(
        address client
    ) external view returns (bytes32[] memory) {
        return clientTasks[client];
    }

    /**
     * @notice Get agent's tasks
     * @param agent Agent address
     */
    function getAgentTasks(
        address agent
    ) external view returns (bytes32[] memory) {
        return agentTasks[agent];
    }

    /**
     * @notice Calculate task ID from parameters
     * @param client Client address
     * @param nonce Client's task nonce
     */
    function calculateTaskId(
        address client,
        uint256 nonce
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(client, nonce));
    }

    // ============ Admin Functions ============

    /**
     * @notice Update platform fee
     */
    function setPlatformFee(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_PLATFORM_FEE_BPS) {
            revert TaskEscrow__InvalidAmount();
        }
        emit PlatformFeeUpdated(platformFeeBps, newFeeBps);
        platformFeeBps = newFeeBps;
    }

    /**
     * @notice Update fee collector
     */
    function setFeeCollector(address newCollector) external onlyOwner {
        emit FeeCollectorUpdated(feeCollector, newCollector);
        feeCollector = newCollector;
    }

    /**
     * @notice Add or remove supported token
     */
    function setSupportedToken(
        address token,
        bool isSupported
    ) external onlyOwner {
        supportedTokens[token] = isSupported;
        emit SupportedTokenUpdated(token, isSupported);
    }

    /**
     * @notice Add or remove authorized resolver
     */
    function setResolver(
        address resolver,
        bool isAuthorized
    ) external onlyOwner {
        authorizedResolvers[resolver] = isAuthorized;
        emit ResolverUpdated(resolver, isAuthorized);
    }

    /**
     * @notice Update default deadline
     */
    function setDefaultDeadline(uint256 newDeadline) external onlyOwner {
        defaultDeadline = newDeadline;
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
     * @notice Internal function to create a task
     */
    function _createTask(
        address agent,
        uint256 payment,
        address token,
        string calldata taskUri,
        uint256 deadline
    ) internal returns (bytes32 taskId) {
        if (payment == 0) {
            revert TaskEscrow__InvalidAmount();
        }

        uint256 actualDeadline = deadline == 0 
            ? block.timestamp + defaultDeadline 
            : deadline;

        if (actualDeadline <= block.timestamp) {
            revert TaskEscrow__InvalidDeadline();
        }

        taskId = keccak256(
            abi.encodePacked(
                msg.sender,
                totalTasks,
                block.timestamp
            )
        );

        Task storage task = tasks[taskId];
        task.taskId = taskId;
        task.client = msg.sender;
        task.agent = agent;
        task.payment = payment;
        task.token = token;
        task.taskUri = taskUri;
        task.createdAt = block.timestamp;
        task.deadline = actualDeadline;
        task.status = TaskStatus.Pending;

        clientTasks[msg.sender].push(taskId);
        if (agent != address(0)) {
            task.assignedAt = block.timestamp;
            task.status = TaskStatus.Assigned;
            agentTasks[agent].push(taskId);
        }

        totalTasks++;
        totalVolume += payment;

        emit TaskCreated(
            taskId,
            msg.sender,
            payment,
            token,
            taskUri,
            actualDeadline
        );

        if (agent != address(0)) {
            emit TaskAssigned(taskId, agent, block.timestamp);
        }
    }

    /**
     * @notice Release payment to agent
     */
    function _releasePayment(
        bytes32 taskId,
        address agent,
        uint256 amount,
        address token
    ) internal {
        uint256 fee = (amount * platformFeeBps) / 10000;
        uint256 agentAmount = amount - fee;

        _transferToken(agent, agentAmount, token);
        if (fee > 0) {
            _transferToken(feeCollector, fee, token);
        }

        emit PaymentReleased(taskId, agent, agentAmount, fee);
    }

    /**
     * @notice Refund payment to client
     */
    function _refundPayment(
        bytes32 taskId,
        address client,
        uint256 amount,
        address token
    ) internal {
        _transferToken(client, amount, token);
        emit PaymentRefunded(taskId, client, amount);
    }

    /**
     * @notice Transfer token (CELO or ERC20)
     */
    function _transferToken(
        address to,
        uint256 amount,
        address token
    ) internal {
        if (token == CELO_TOKEN) {
            (bool success, ) = payable(to).call{value: amount}("");
            if (!success) {
                revert TaskEscrow__TransferFailed();
            }
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    // ============ Receive Function ============

    receive() external payable {
        // Allow receiving CELO for task payments
    }
}
