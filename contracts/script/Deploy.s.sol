// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { LPDoctorReports } from "../src/LPDoctorReports.sol";
import { LPDoctorAgent } from "../src/LPDoctorAgent.sol";

/// @notice Deploys LPDoctorReports + LPDoctorAgent on the target chain (0G
/// Galileo testnet by default; pass --rpc-url to swap). After deploy,
/// copy the printed addresses into the project root .env as
/// LPDOCTOR_REPORTS_CONTRACT and LPDOCTOR_AGENT_CONTRACT.
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("WALLET_DEPLOYER_PK");
        bytes32 codeImage = vm.envOr("LPDOCTOR_CODE_IMAGE_HASH", bytes32(0));
        string memory metadataUri = vm.envOr(
            "LPDOCTOR_METADATA_URI",
            string("og://lpdoctor-agent-v0.11.0")
        );
        // Royalty config — treasury defaults to deployer; fee defaults
        // to 20 % (2_000 bps). Override via env at deploy time.
        address treasury = vm.envOr(
            "LPDOCTOR_PROTOCOL_TREASURY",
            vm.addr(deployerKey)
        );
        uint16 feeBps = uint16(
            vm.envOr("LPDOCTOR_PROTOCOL_FEE_BPS", uint256(2000))
        );

        vm.startBroadcast(deployerKey);

        LPDoctorReports reports = new LPDoctorReports();
        console2.log("LPDoctorReports deployed at", address(reports));

        LPDoctorAgent inft = new LPDoctorAgent(treasury, feeBps);
        console2.log("LPDoctorAgent deployed at", address(inft));
        console2.log("LPDoctorAgent treasury:", treasury);
        console2.log("LPDoctorAgent feeBps:", feeBps);

        // Optional: mint the agent iNFT to the deployer in the same tx.
        if (codeImage != bytes32(0)) {
            uint256 tokenId = inft.mint(codeImage, metadataUri);
            console2.log("LPDoctorAgent minted, tokenId:", tokenId);
        }

        vm.stopBroadcast();
    }
}
