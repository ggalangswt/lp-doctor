// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { LPDoctorReports } from "../src/LPDoctorReports.sol";

contract LPDoctorReportsTest is Test {
    LPDoctorReports internal registry;

    address internal agent = address(0xA1);
    address internal otherAgent = address(0xA2);
    uint256 internal tokenId = 482910;
    bytes32 internal rootHash = bytes32(uint256(0x7ac4f6e2));
    bytes internal attestation = hex"deadbeef";

    event ReportPublished(
        bytes32 indexed rootHash,
        uint256 indexed tokenId,
        address indexed publisher,
        uint64 timestamp
    );

    function setUp() public {
        registry = new LPDoctorReports();
    }

    function test_publishReport_emitsEvent_andStoresEntry() public {
        vm.warp(1735689600); // 2025-01-01
        vm.prank(agent);
        vm.expectEmit(true, true, true, true);
        emit ReportPublished(rootHash, tokenId, agent, uint64(block.timestamp));
        registry.publishReport(tokenId, rootHash, attestation);

        (
            address publisher,
            uint64 ts,
            uint256 storedTokenId,
            bytes32 storedRoot,
            bytes memory storedAtt
        ) = registry.reports(rootHash);

        assertEq(publisher, agent);
        assertEq(ts, uint64(block.timestamp));
        assertEq(storedTokenId, tokenId);
        assertEq(storedRoot, rootHash);
        assertEq(storedAtt, attestation);
        assertEq(registry.reportCount(tokenId), 1);
        assertEq(registry.reportAt(tokenId, 0), rootHash);
    }

    function test_publishReport_revertsOnEmptyRootHash() public {
        vm.expectRevert(LPDoctorReports.EmptyRootHash.selector);
        registry.publishReport(tokenId, bytes32(0), attestation);
    }

    function test_publishReport_revertsOnDuplicate() public {
        vm.prank(agent);
        registry.publishReport(tokenId, rootHash, attestation);

        vm.prank(otherAgent);
        vm.expectRevert(
            abi.encodeWithSelector(LPDoctorReports.AlreadyPublished.selector, rootHash)
        );
        registry.publishReport(tokenId, rootHash, attestation);
    }

    function test_publishReport_appendsHistoryPerTokenId() public {
        vm.startPrank(agent);
        registry.publishReport(tokenId, bytes32(uint256(0x01)), "");
        registry.publishReport(tokenId, bytes32(uint256(0x02)), "");
        registry.publishReport(tokenId, bytes32(uint256(0x03)), "");
        vm.stopPrank();

        bytes32[] memory all = registry.reportsFor(tokenId);
        assertEq(all.length, 3);
        assertEq(all[0], bytes32(uint256(0x01)));
        assertEq(all[2], bytes32(uint256(0x03)));
    }
}
