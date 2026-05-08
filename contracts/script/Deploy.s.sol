// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {AgentTreasury} from "../src/AgentTreasury.sol";

contract Deploy is Script {
    // Ethereum Mainnet addresses
    address constant LIDO = 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84;
    address constant WSTETH = 0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        AgentTreasury treasury = new AgentTreasury(LIDO, WSTETH);
        console.log("AgentTreasury deployed at:", address(treasury));

        vm.stopBroadcast();
    }
}
