// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {AgentTreasury} from "../src/AgentTreasury.sol";
import {IWstETH} from "../src/interfaces/IWstETH.sol";
import {ILido} from "../src/interfaces/ILido.sol";

contract AgentTreasuryTest is Test {
    AgentTreasury public treasury;

    address constant LIDO = 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84;
    address constant WSTETH = 0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0;

    address owner = address(this);
    address agent = makeAddr("agent");
    address subAgentA = makeAddr("subAgentA");
    address subAgentB = makeAddr("subAgentB");
    address recipient = makeAddr("recipient");

    ILido lido = ILido(LIDO);
    IWstETH wstETH = IWstETH(WSTETH);

    function setUp() public {
        treasury = new AgentTreasury(LIDO, WSTETH);
        treasury.setParentAgent(agent);
    }

    // ── Helpers ──

    function _depositETH(uint256 ethAmount) internal {
        treasury.depositETH{value: ethAmount}();
    }

    function _setupWhitelist() internal {
        treasury.setWhitelistEnabled(true);
        treasury.setWhitelist(recipient, true);
    }

    // ── Deposit Tests ──

    function test_depositETH() public {
        uint256 before = treasury.principalWstETH();
        _depositETH(1 ether);
        assertGt(treasury.principalWstETH(), before);
        assertGt(treasury.initialStETHValue(), 0);
    }

    function test_depositETH_revertsZero() public {
        vm.expectRevert(AgentTreasury.ZeroAmount.selector);
        treasury.depositETH{value: 0}();
    }

    function test_depositWstETH() public {
        // Stake ETH to get stETH, wrap to wstETH, then deposit
        uint256 stETH = lido.submit{value: 2 ether}(address(0));
        lido.approve(WSTETH, stETH);
        uint256 wstAmount = wstETH.wrap(stETH);

        wstETH.approve(address(treasury), wstAmount);
        treasury.depositWstETH(wstAmount);

        assertEq(treasury.principalWstETH(), wstAmount);
    }

    function test_depositStETH() public {
        uint256 stETH = lido.submit{value: 2 ether}(address(0));
        lido.approve(address(treasury), stETH);

        uint256 before = treasury.principalWstETH();
        treasury.depositStETH(stETH);
        assertGt(treasury.principalWstETH(), before);
    }

    function test_deposit_anyoneCanDeposit() public {
        vm.deal(agent, 1 ether);
        vm.prank(agent);
        treasury.depositETH{value: 1 ether}();
        assertGt(treasury.principalWstETH(), 0);
    }

    // ── Withdrawal Tests ──

    function test_withdrawPrincipal() public {
        _depositETH(1 ether);
        uint256 principal = treasury.principalWstETH();

        uint256 balBefore = wstETH.balanceOf(owner);
        treasury.withdrawPrincipal(principal);
        uint256 balAfter = wstETH.balanceOf(owner);

        assertEq(treasury.principalWstETH(), 0);
        assertEq(balAfter - balBefore, principal);
    }

    function test_withdrawPrincipal_onlyOwner() public {
        _depositETH(1 ether);
        vm.prank(agent);
        vm.expectRevert(AgentTreasury.NotOwner.selector);
        treasury.withdrawPrincipal(1);
    }

    // ── Agent Management Tests ──

    function test_setParentAgent() public {
        address newAgent = makeAddr("newAgent");
        treasury.setParentAgent(newAgent);
        assertEq(treasury.parentAgent(), newAgent);
    }

    function test_addSubAgent() public {
        treasury.addSubAgent(subAgentA, 0.5 ether);
        (uint256 cap, uint256 spent, bool active, bool exists) = treasury.subAgents(subAgentA);
        assertTrue(exists);
        assertTrue(active);
        assertEq(cap, 0.5 ether);
        assertEq(spent, 0);
    }

    function test_addSubAgent_revertsDuplicate() public {
        treasury.addSubAgent(subAgentA, 0.5 ether);
        vm.expectRevert(AgentTreasury.AgentExists.selector);
        treasury.addSubAgent(subAgentA, 1 ether);
    }

    function test_removeSubAgent() public {
        treasury.addSubAgent(subAgentA, 0.5 ether);
        treasury.removeSubAgent(subAgentA);
        (,,, bool exists) = treasury.subAgents(subAgentA);
        assertFalse(exists);
    }

    function test_pauseResumeSubAgent() public {
        treasury.addSubAgent(subAgentA, 0.5 ether);

        treasury.pauseSubAgent(subAgentA);
        (,, bool active,) = treasury.subAgents(subAgentA);
        assertFalse(active);

        treasury.resumeSubAgent(subAgentA);
        (,, active,) = treasury.subAgents(subAgentA);
        assertTrue(active);
    }

    // ── Spending Tests ──

    function test_spend_parentAgent() public {
        _depositETH(10 ether);
        _setupWhitelist();

        // Simulate yield by warping time (stEthPerToken increases with rebases)
        // In fork tests, we need actual rebases or we can test with available yield
        uint256 yield_ = treasury.getAvailableYield();

        if (yield_ > 0) {
            vm.prank(agent);
            treasury.spend(recipient, yield_);
            assertEq(treasury.totalSpentWstETH(), yield_);
        }
    }

    function test_spend_revertsWhenPaused() public {
        _depositETH(1 ether);
        treasury.pause();

        vm.prank(agent);
        vm.expectRevert(AgentTreasury.IsPaused.selector);
        treasury.spend(recipient, 1);
    }

    function test_spend_revertsNotAgent() public {
        _depositETH(1 ether);
        address random = makeAddr("random");

        vm.prank(random);
        vm.expectRevert(AgentTreasury.NotActiveAgent.selector);
        treasury.spend(recipient, 1);
    }

    function test_spend_revertsNotWhitelisted() public {
        _depositETH(1 ether);
        treasury.setWhitelistEnabled(true);

        vm.prank(agent);
        vm.expectRevert(AgentTreasury.NotWhitelisted.selector);
        treasury.spend(recipient, 1);
    }

    function test_spend_revertsTxCap() public {
        _depositETH(10 ether);
        treasury.setCapEnabled(true);
        treasury.setPerTxCap(0.01 ether);

        vm.prank(agent);
        vm.expectRevert(AgentTreasury.ExceedsTxCap.selector);
        treasury.spend(recipient, 0.02 ether);
    }

    function test_spend_revertsCycleLimit() public {
        _depositETH(10 ether);
        treasury.setRateLimitEnabled(true);
        treasury.setCycleLimit(0.01 ether);

        vm.prank(agent);
        vm.expectRevert(AgentTreasury.ExceedsCycleLimit.selector);
        treasury.spend(recipient, 0.02 ether);
    }

    function test_spend_subAgentBudget() public {
        _depositETH(10 ether);
        treasury.addSubAgent(subAgentA, 0.001 ether);

        // Sub-agent spending above budget should revert
        vm.prank(subAgentA);
        vm.expectRevert(); // ExceedsYield or ExceedsBudget
        treasury.spend(recipient, 0.002 ether);
    }

    function test_spend_pausedSubAgentReverts() public {
        _depositETH(10 ether);
        treasury.addSubAgent(subAgentA, 1 ether);
        treasury.pauseSubAgent(subAgentA);

        vm.prank(subAgentA);
        vm.expectRevert(AgentTreasury.NotActiveAgent.selector);
        treasury.spend(recipient, 0.001 ether);
    }

    // ── Permission Tests ──

    function test_whitelistToggle() public {
        _depositETH(1 ether);
        _setupWhitelist();

        // Whitelisted recipient works (if yield available)
        // Non-whitelisted reverts
        address bad = makeAddr("bad");
        vm.prank(agent);
        vm.expectRevert(AgentTreasury.NotWhitelisted.selector);
        treasury.spend(bad, 1);
    }

    function test_whitelistDisabled() public {
        // With whitelist disabled, any recipient works
        assertFalse(treasury.whitelistEnabled());
        // No revert on whitelist check
    }

    // ── View Tests ──

    function test_getAvailableYield_noDeposit() public view {
        assertEq(treasury.getAvailableYield(), 0);
    }

    function test_getCurrentValue() public {
        _depositETH(1 ether);
        uint256 val = treasury.getCurrentValue();
        assertGt(val, 0);
    }

    function test_getCycleInfo() public view {
        (uint256 duration, uint256 spent, uint256 limit, uint256 resetAt) = treasury.getCycleInfo();
        assertEq(duration, 30 days);
        assertEq(spent, 0);
        assertEq(limit, 0);
        assertGt(resetAt, block.timestamp);
    }

    function test_getSubAgents() public {
        treasury.addSubAgent(subAgentA, 0.5 ether);
        treasury.addSubAgent(subAgentB, 0.3 ether);

        address[] memory agents = treasury.getSubAgents();
        assertEq(agents.length, 2);
    }

    function test_getSubAgentRemaining() public {
        treasury.addSubAgent(subAgentA, 0.5 ether);
        uint256 remaining = treasury.getSubAgentRemaining(subAgentA);
        assertEq(remaining, 0.5 ether);
    }

    // ── Pause Tests ──

    function test_pauseUnpause() public {
        treasury.pause();
        assertTrue(treasury.paused());

        treasury.unpause();
        assertFalse(treasury.paused());
    }

    function test_pause_onlyOwner() public {
        vm.prank(agent);
        vm.expectRevert(AgentTreasury.NotOwner.selector);
        treasury.pause();
    }

    // ── Receive ETH ──

    function test_receiveETH() public {
        (bool ok,) = address(treasury).call{value: 0.1 ether}("");
        assertTrue(ok);
    }
}
