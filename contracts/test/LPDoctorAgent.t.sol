// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { LPDoctorAgent } from "../src/LPDoctorAgent.sol";

contract LPDoctorAgentTest is Test {
    LPDoctorAgent internal inft;
    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);
    address internal carol = address(0xCA401);
    address internal treasury = address(0xBEEF);
    bytes32 internal codeImage = bytes32(uint256(0xC0DE));
    string internal metadataUri = "og://lpdoctor-agent-v0.11.0";

    event AgentMinted(
        uint256 indexed tokenId,
        address indexed owner,
        bytes32 codeImageHash,
        string metadataUri
    );
    event MigrationRecorded(
        uint256 indexed tokenId,
        bytes32 indexed permit2Digest,
        uint64 newCount
    );
    event LicenseMinted(
        uint256 indexed tokenId,
        address indexed licensee,
        uint64 expiresAt,
        uint256 paid,
        uint256 ownerCut,
        uint256 protocolCut
    );

    function setUp() public {
        // 20 % protocol fee → 80 % to owner.
        inft = new LPDoctorAgent(treasury, 2000);
    }

    function test_constructor_storesImmutables() public view {
        assertEq(inft.protocolTreasury(), treasury);
        assertEq(inft.protocolFeeBps(), 2000);
    }

    function test_constructor_revertsOnZeroTreasury() public {
        vm.expectRevert(LPDoctorAgent.InvalidTreasury.selector);
        new LPDoctorAgent(address(0), 2000);
    }

    function test_constructor_revertsOnFeeTooHigh() public {
        vm.expectRevert(LPDoctorAgent.FeeTooHigh.selector);
        new LPDoctorAgent(treasury, 10_001);
    }

    function test_mint_assignsTokenId_andOwner() public {
        vm.expectEmit(true, true, false, true);
        emit AgentMinted(1, alice, codeImage, metadataUri);
        vm.prank(alice);
        uint256 tokenId = inft.mint(codeImage, metadataUri);
        assertEq(tokenId, 1);
        assertEq(inft.agentOf(alice), 1);
        (
            address owner,
            bytes32 memRoot,
            bytes32 storedImage,
            ,
            ,
            uint64 reputation,
            uint64 migrations,
            string memory uri
        ) = inft.agents(1);
        assertEq(owner, alice);
        assertEq(memRoot, bytes32(0));
        assertEq(storedImage, codeImage);
        assertEq(reputation, 0);
        assertEq(migrations, 0);
        assertEq(uri, metadataUri);
    }

    function test_mint_revertsOnSecondMintBySameOwner() public {
        vm.startPrank(alice);
        inft.mint(codeImage, metadataUri);
        vm.expectRevert(LPDoctorAgent.AlreadyMinted.selector);
        inft.mint(codeImage, metadataUri);
        vm.stopPrank();
    }

    function test_updateMemoryRoot_onlyByOwner() public {
        vm.prank(alice);
        uint256 tokenId = inft.mint(codeImage, metadataUri);

        vm.prank(bob);
        vm.expectRevert(LPDoctorAgent.NotOwner.selector);
        inft.updateMemoryRoot(tokenId, bytes32(uint256(0x42)));

        vm.prank(alice);
        inft.updateMemoryRoot(tokenId, bytes32(uint256(0x42)));
        assertEq(inft.memoryRootOf(tokenId), bytes32(uint256(0x42)));
    }

    function test_recordDiagnose_incrementsReputation() public {
        vm.startPrank(alice);
        uint256 tokenId = inft.mint(codeImage, metadataUri);
        inft.recordDiagnose(tokenId);
        inft.recordDiagnose(tokenId);
        inft.recordDiagnose(tokenId);
        vm.stopPrank();
        (, , , , , uint64 reputation, , ) = inft.agents(tokenId);
        assertEq(reputation, 3);
    }

    function test_transferAgent_movesOwnership() public {
        vm.prank(alice);
        uint256 tokenId = inft.mint(codeImage, metadataUri);

        vm.prank(alice);
        inft.transferAgent(tokenId, bob);
        (address owner, , , , , , , ) = inft.agents(tokenId);
        assertEq(owner, bob);
        assertEq(inft.agentOf(alice), 0);
        assertEq(inft.agentOf(bob), tokenId);
    }

    // --- recordMigration --------------------------------------------------

    function test_recordMigration_incrementsCounter() public {
        vm.startPrank(alice);
        uint256 tokenId = inft.mint(codeImage, metadataUri);
        bytes32 digest = bytes32(uint256(0xDEADBEEF));

        vm.expectEmit(true, true, false, true);
        emit MigrationRecorded(tokenId, digest, 1);
        inft.recordMigration(tokenId, digest);

        vm.expectEmit(true, true, false, true);
        emit MigrationRecorded(tokenId, digest, 2);
        inft.recordMigration(tokenId, digest);
        vm.stopPrank();

        (, , , , , , uint64 migrations, ) = inft.agents(tokenId);
        assertEq(migrations, 2);
    }

    function test_recordMigration_onlyByOwner() public {
        vm.prank(alice);
        uint256 tokenId = inft.mint(codeImage, metadataUri);

        vm.prank(bob);
        vm.expectRevert(LPDoctorAgent.NotOwner.selector);
        inft.recordMigration(tokenId, bytes32(uint256(0x1)));
    }

    function test_recordMigration_revertsOnUnknownToken() public {
        vm.prank(alice);
        vm.expectRevert(LPDoctorAgent.UnknownToken.selector);
        inft.recordMigration(999, bytes32(uint256(0x1)));
    }

    // --- mintLicense + isLicensed -----------------------------------------

    function test_isLicensed_ownerAlwaysLicensed() public {
        vm.prank(alice);
        uint256 tokenId = inft.mint(codeImage, metadataUri);
        assertTrue(inft.isLicensed(tokenId, alice));
    }

    function test_isLicensed_strangerNotLicensedByDefault() public {
        vm.prank(alice);
        uint256 tokenId = inft.mint(codeImage, metadataUri);
        assertFalse(inft.isLicensed(tokenId, bob));
    }

    function test_isLicensed_unknownTokenReturnsFalse() public view {
        assertFalse(inft.isLicensed(999, bob));
    }

    function test_mintLicense_paysOwnerAndTreasury() public {
        vm.prank(alice);
        uint256 tokenId = inft.mint(codeImage, metadataUri);

        uint256 ownerBefore = alice.balance;
        uint256 treasuryBefore = treasury.balance;

        // bob pays 1 ether for a 24 h license to call against tokenId.
        uint64 expiry = uint64(block.timestamp + 24 hours);
        vm.deal(bob, 1 ether);

        vm.expectEmit(true, true, false, true);
        emit LicenseMinted(tokenId, bob, expiry, 1 ether, 0.8 ether, 0.2 ether);

        vm.prank(bob);
        inft.mintLicense{ value: 1 ether }(tokenId, bob, expiry);

        // 80 % to owner, 20 % to treasury.
        assertEq(alice.balance - ownerBefore, 0.8 ether);
        assertEq(treasury.balance - treasuryBefore, 0.2 ether);

        assertTrue(inft.isLicensed(tokenId, bob));
    }

    function test_mintLicense_thirdPartyCanPayForLicensee() public {
        // carol pays for bob's license — ensures licensee != msg.sender works.
        vm.prank(alice);
        uint256 tokenId = inft.mint(codeImage, metadataUri);
        uint64 expiry = uint64(block.timestamp + 1 hours);
        vm.deal(carol, 0.5 ether);

        vm.prank(carol);
        inft.mintLicense{ value: 0.5 ether }(tokenId, bob, expiry);

        assertTrue(inft.isLicensed(tokenId, bob));
        assertFalse(inft.isLicensed(tokenId, carol));
    }

    function test_mintLicense_revertsAfterExpiry() public {
        vm.prank(alice);
        uint256 tokenId = inft.mint(codeImage, metadataUri);
        uint64 expiry = uint64(block.timestamp + 1 hours);
        vm.deal(bob, 0.1 ether);

        vm.prank(bob);
        inft.mintLicense{ value: 0.1 ether }(tokenId, bob, expiry);
        assertTrue(inft.isLicensed(tokenId, bob));

        // jump past expiry — license must lapse.
        vm.warp(uint256(expiry) + 1);
        assertFalse(inft.isLicensed(tokenId, bob));
    }

    function test_mintLicense_revertsOnZeroPayment() public {
        vm.prank(alice);
        uint256 tokenId = inft.mint(codeImage, metadataUri);
        vm.expectRevert(LPDoctorAgent.NoPayment.selector);
        inft.mintLicense(tokenId, bob, uint64(block.timestamp + 1 hours));
    }

    function test_mintLicense_revertsOnExpiryInPast() public {
        vm.prank(alice);
        uint256 tokenId = inft.mint(codeImage, metadataUri);
        vm.deal(bob, 0.1 ether);
        vm.prank(bob);
        vm.expectRevert(LPDoctorAgent.InvalidExpiry.selector);
        inft.mintLicense{ value: 0.1 ether }(tokenId, bob, uint64(block.timestamp));
    }

    function test_mintLicense_revertsOnUnknownToken() public {
        vm.deal(bob, 0.1 ether);
        vm.prank(bob);
        vm.expectRevert(LPDoctorAgent.UnknownToken.selector);
        inft.mintLicense{ value: 0.1 ether }(
            999,
            bob,
            uint64(block.timestamp + 1 hours)
        );
    }

    function test_mintLicense_zeroProtocolFeeAllToOwner() public {
        // Re-deploy with 0 % fee — owner gets the full payment.
        LPDoctorAgent zeroFee = new LPDoctorAgent(treasury, 0);
        vm.prank(alice);
        uint256 tokenId = zeroFee.mint(codeImage, metadataUri);

        uint256 ownerBefore = alice.balance;
        uint256 treasuryBefore = treasury.balance;
        vm.deal(bob, 1 ether);
        vm.prank(bob);
        zeroFee.mintLicense{ value: 1 ether }(
            tokenId,
            bob,
            uint64(block.timestamp + 1 hours)
        );
        assertEq(alice.balance - ownerBefore, 1 ether);
        assertEq(treasury.balance - treasuryBefore, 0);
    }
}
