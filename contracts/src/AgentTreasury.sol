// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IWstETH} from "./interfaces/IWstETH.sol";
import {ILido} from "./interfaces/ILido.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title AgentTreasury
/// @notice Yield-bearing operating budget for AI agents backed by wstETH.
///         Owner deposits wstETH, principal is locked, only yield is spendable.
/// @dev Uses wstETH (non-rebasing) for clean yield accounting.
///      Yield = current stETH value of wstETH - initial stETH value - total spent.
contract AgentTreasury is ReentrancyGuard {
    // ──────────────────────────────────────────────
    //  Constants
    // ──────────────────────────────────────────────

    ILido public immutable lido;
    IWstETH public immutable wstETH;

    // ──────────────────────────────────────────────
    //  Storage
    // ──────────────────────────────────────────────

    address public owner;
    address public parentAgent;

    uint256 public principalWstETH;
    uint256 public initialStETHValue;
    uint256 public totalSpentWstETH;

    struct SubAgent {
        uint256 budgetCap;
        uint256 spent;
        bool active;
        bool exists;
    }

    mapping(address => SubAgent) public subAgents;
    address[] public subAgentList;

    bool public whitelistEnabled;
    mapping(address => bool) public whitelist;

    bool public capEnabled;
    uint256 public perTxCap;

    bool public rateLimitEnabled;
    uint256 public cycleDuration;
    uint256 public cycleLimit;
    uint256 public cycleSpent;
    uint256 public cycleStart;

    bool public paused;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event Deposited(uint256 wstETHAmount, uint256 stETHSnapshot);
    event PrincipalWithdrawn(uint256 wstETHAmount);
    event ParentAgentSet(address indexed agent);
    event SubAgentAdded(address indexed agent, uint256 budgetCap);
    event SubAgentRemoved(address indexed agent);
    event SubAgentPaused(address indexed agent);
    event SubAgentResumed(address indexed agent);
    event SubAgentBudgetSet(address indexed agent, uint256 newCap);
    event Spent(address indexed agent, address indexed to, uint256 wstETHAmount);
    event WhitelistSet(address indexed addr, bool allowed);
    event Paused();
    event Unpaused();
    event CycleReset(uint256 timestamp);

    // ──────────────────────────────────────────────
    //  Errors
    // ──────────────────────────────────────────────

    error NotOwner();
    error NotActiveAgent();
    error IsPaused();
    error NotWhitelisted();
    error ExceedsTxCap();
    error ExceedsCycleLimit();
    error ExceedsYield();
    error ExceedsBudget();
    error ZeroAmount();
    error ZeroAddress();
    error AgentExists();
    error AgentNotFound();

    // ──────────────────────────────────────────────
    //  Modifiers
    // ──────────────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyActiveAgent() {
        if (paused) revert IsPaused();
        bool isParent = msg.sender == parentAgent;
        bool isSub = subAgents[msg.sender].exists && subAgents[msg.sender].active;
        if (!isParent && !isSub) revert NotActiveAgent();
        _;
    }

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    constructor(address _lido, address _wstETH) {
        if (_lido == address(0) || _wstETH == address(0)) revert ZeroAddress();
        lido = ILido(_lido);
        wstETH = IWstETH(_wstETH);
        owner = msg.sender;
        cycleStart = block.timestamp;
        cycleDuration = 30 days;
    }

    // ──────────────────────────────────────────────
    //  Deposits
    // ──────────────────────────────────────────────

    /// @notice Deposit wstETH directly into treasury. Anyone can deposit.
    function depositWstETH(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        wstETH.transferFrom(msg.sender, address(this), amount);
        _recordDeposit(amount);
    }

    /// @notice Deposit ETH — auto-stakes via Lido then wraps to wstETH. Anyone can deposit.
    function depositETH() external payable nonReentrant {
        if (msg.value == 0) revert ZeroAmount();

        uint256 stETHReceived = lido.submit{value: msg.value}(address(0));
        lido.approve(address(wstETH), stETHReceived);
        uint256 wstETHReceived = wstETH.wrap(stETHReceived);

        _recordDeposit(wstETHReceived);
    }

    /// @notice Deposit stETH — auto-wraps to wstETH. Anyone can deposit.
    function depositStETH(uint256 stETHAmount) external nonReentrant {
        if (stETHAmount == 0) revert ZeroAmount();

        lido.transferFrom(msg.sender, address(this), stETHAmount);
        lido.approve(address(wstETH), stETHAmount);
        uint256 wstETHReceived = wstETH.wrap(stETHAmount);

        _recordDeposit(wstETHReceived);
    }

    function _recordDeposit(uint256 wstETHAmount) internal {
        uint256 stETHValue = wstETH.getStETHByWstETH(wstETHAmount);
        principalWstETH += wstETHAmount;
        initialStETHValue += stETHValue;
        emit Deposited(wstETHAmount, stETHValue);
    }

    // ──────────────────────────────────────────────
    //  Withdrawals (owner only)
    // ──────────────────────────────────────────────

    /// @notice Withdraw principal wstETH. Only owner, never agent.
    function withdrawPrincipal(uint256 wstETHAmount) external onlyOwner nonReentrant {
        if (wstETHAmount == 0) revert ZeroAmount();
        if (wstETHAmount > principalWstETH) revert ExceedsYield();

        uint256 stETHPortion = wstETH.getStETHByWstETH(wstETHAmount);
        principalWstETH -= wstETHAmount;
        initialStETHValue = initialStETHValue > stETHPortion
            ? initialStETHValue - stETHPortion
            : 0;

        wstETH.transfer(msg.sender, wstETHAmount);
        emit PrincipalWithdrawn(wstETHAmount);
    }

    // ──────────────────────────────────────────────
    //  Agent Management
    // ──────────────────────────────────────────────

    function setParentAgent(address agent) external onlyOwner {
        if (agent == address(0)) revert ZeroAddress();
        parentAgent = agent;
        emit ParentAgentSet(agent);
    }

    function addSubAgent(address agent, uint256 budgetCap) external onlyOwner {
        if (agent == address(0)) revert ZeroAddress();
        if (subAgents[agent].exists) revert AgentExists();

        subAgents[agent] = SubAgent({budgetCap: budgetCap, spent: 0, active: true, exists: true});
        subAgentList.push(agent);
        emit SubAgentAdded(agent, budgetCap);
    }

    function removeSubAgent(address agent) external onlyOwner {
        if (!subAgents[agent].exists) revert AgentNotFound();
        delete subAgents[agent];

        uint256 len = subAgentList.length;
        for (uint256 i; i < len; ++i) {
            if (subAgentList[i] == agent) {
                subAgentList[i] = subAgentList[len - 1];
                subAgentList.pop();
                break;
            }
        }
        emit SubAgentRemoved(agent);
    }

    function pauseSubAgent(address agent) external onlyOwner {
        if (!subAgents[agent].exists) revert AgentNotFound();
        subAgents[agent].active = false;
        emit SubAgentPaused(agent);
    }

    function resumeSubAgent(address agent) external onlyOwner {
        if (!subAgents[agent].exists) revert AgentNotFound();
        subAgents[agent].active = true;
        emit SubAgentResumed(agent);
    }

    function setSubAgentBudget(address agent, uint256 newCap) external onlyOwner {
        if (!subAgents[agent].exists) revert AgentNotFound();
        subAgents[agent].budgetCap = newCap;
        emit SubAgentBudgetSet(agent, newCap);
    }

    // ──────────────────────────────────────────────
    //  Permissions
    // ──────────────────────────────────────────────

    function setWhitelistEnabled(bool enabled) external onlyOwner {
        whitelistEnabled = enabled;
    }

    function setWhitelist(address addr, bool allowed) external onlyOwner {
        if (addr == address(0)) revert ZeroAddress();
        whitelist[addr] = allowed;
        emit WhitelistSet(addr, allowed);
    }

    function setCapEnabled(bool enabled) external onlyOwner {
        capEnabled = enabled;
    }

    function setPerTxCap(uint256 maxWstETH) external onlyOwner {
        perTxCap = maxWstETH;
    }

    function setRateLimitEnabled(bool enabled) external onlyOwner {
        rateLimitEnabled = enabled;
    }

    function setCycleDuration(uint256 duration) external onlyOwner {
        cycleDuration = duration;
    }

    function setCycleLimit(uint256 maxWstETH) external onlyOwner {
        cycleLimit = maxWstETH;
    }

    // ──────────────────────────────────────────────
    //  Emergency
    // ──────────────────────────────────────────────

    function pause() external onlyOwner {
        paused = true;
        emit Paused();
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused();
    }

    // ──────────────────────────────────────────────
    //  Spending
    // ──────────────────────────────────────────────

    /// @notice Spend yield to a recipient. Only callable by active agents.
    /// @param to Recipient address (must be whitelisted if whitelist is enabled).
    /// @param wstETHAmount Amount of wstETH to send from yield.
    function spend(address to, uint256 wstETHAmount) external onlyActiveAgent nonReentrant {
        if (wstETHAmount == 0) revert ZeroAmount();
        if (to == address(0)) revert ZeroAddress();
        if (whitelistEnabled && !whitelist[to]) revert NotWhitelisted();
        if (capEnabled && wstETHAmount > perTxCap) revert ExceedsTxCap();

        if (rateLimitEnabled) {
            _resetCycleIfNeeded();
            if (cycleSpent + wstETHAmount > cycleLimit) revert ExceedsCycleLimit();
        }

        uint256 available = getAvailableYield();
        if (wstETHAmount > available) revert ExceedsYield();

        if (subAgents[msg.sender].exists) {
            SubAgent storage sa = subAgents[msg.sender];
            if (sa.spent + wstETHAmount > sa.budgetCap) revert ExceedsBudget();
            sa.spent += wstETHAmount;
        }

        totalSpentWstETH += wstETHAmount;
        if (rateLimitEnabled) cycleSpent += wstETHAmount;

        wstETH.transfer(to, wstETHAmount);
        emit Spent(msg.sender, to, wstETHAmount);
    }

    function _resetCycleIfNeeded() internal {
        if (block.timestamp >= cycleStart + cycleDuration) {
            cycleStart = block.timestamp;
            cycleSpent = 0;

            uint256 len = subAgentList.length;
            for (uint256 i; i < len; ++i) {
                subAgents[subAgentList[i]].spent = 0;
            }

            emit CycleReset(block.timestamp);
        }
    }

    // ──────────────────────────────────────────────
    //  View Functions
    // ──────────────────────────────────────────────

    /// @notice Returns spendable yield in wstETH.
    function getAvailableYield() public view returns (uint256) {
        if (principalWstETH == 0) return 0;

        uint256 currentStETH = wstETH.getStETHByWstETH(principalWstETH);
        if (currentStETH <= initialStETHValue) return 0;

        uint256 yieldStETH = currentStETH - initialStETHValue;
        uint256 yieldWstETH = wstETH.getWstETHByStETH(yieldStETH);

        return yieldWstETH > totalSpentWstETH ? yieldWstETH - totalSpentWstETH : 0;
    }

    /// @notice Current stETH value of all deposited wstETH.
    function getCurrentValue() external view returns (uint256) {
        return wstETH.getStETHByWstETH(principalWstETH);
    }

    /// @notice Sub-agent remaining budget for this cycle.
    function getSubAgentRemaining(address agent) external view returns (uint256) {
        SubAgent storage sa = subAgents[agent];
        if (!sa.exists) return 0;
        return sa.budgetCap > sa.spent ? sa.budgetCap - sa.spent : 0;
    }

    function getSubAgents() external view returns (address[] memory) {
        return subAgentList;
    }

    function getCycleInfo()
        external
        view
        returns (uint256 duration, uint256 spent, uint256 limit, uint256 resetAt)
    {
        return (cycleDuration, cycleSpent, cycleLimit, cycleStart + cycleDuration);
    }

    receive() external payable {}
}
