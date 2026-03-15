// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/AgentRegistry.sol";
import "../src/ReputationStaking.sol";
import "../src/TaskEscrow.sol";

contract DeployScript is Script {
    // ERC-8004 registries on Celo Alfajores
    address constant IDENTITY_REGISTRY = 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432;
    address constant REPUTATION_REGISTRY = 0x8004BAa17C55a88189AE136b182e5fdA19dE9b63;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy AgentRegistry
        AgentRegistry agentRegistry = new AgentRegistry(IDENTITY_REGISTRY);
        console.log("AgentRegistry deployed at:", address(agentRegistry));

        // Deploy ReputationStaking
        ReputationStaking reputationStaking = new ReputationStaking(
            REPUTATION_REGISTRY,
            address(agentRegistry)
        );
        console.log("ReputationStaking deployed at:", address(reputationStaking));

        // Deploy TaskEscrow
        TaskEscrow taskEscrow = new TaskEscrow(address(agentRegistry));
        console.log("TaskEscrow deployed at:", address(taskEscrow));

        vm.stopBroadcast();

        console.log("\n=== Deployment Complete ===");
        console.log("AgentRegistry:", address(agentRegistry));
        console.log("ReputationStaking:", address(reputationStaking));
        console.log("TaskEscrow:", address(taskEscrow));
    }
}
