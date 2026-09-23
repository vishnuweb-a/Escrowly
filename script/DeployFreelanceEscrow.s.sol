// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {FreelanceEscrow} from "../src/FreelanceEscrow.sol";

contract DeployFreelanceEscrow is Script {

    function run() external returns (FreelanceEscrow) {

        vm.startBroadcast();

        FreelanceEscrow escrow =
            new FreelanceEscrow();

        vm.stopBroadcast();

        return escrow;
    }
}