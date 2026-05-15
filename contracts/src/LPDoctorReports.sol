// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title LPDoctorReports
/// @notice Append-only registry for LPDoctor diagnostic reports anchored on 0G Chain.
///         Each entry pins a (tokenId, rootHash) pair to the publisher + timestamp.
///         The phase 9 anchor adapter calls `publishReport` once the storage upload
///         (phase 8) returns the merkle rootHash. Anyone can verify a report's
///         on-chain commitment by reading `reports(rootHash)` and comparing the
///         publisher to the expected agent address.
contract LPDoctorReports {
    struct Report {
        address publisher;
        uint64 timestamp;
        uint256 tokenId;
        bytes32 rootHash;
        bytes attestation;
    }

    /// @dev rootHash → Report. rootHash is the canonical key.
    mapping(bytes32 => Report) public reports;

    /// @dev tokenId → list of rootHashes (history per position).
    mapping(uint256 => bytes32[]) private _tokenIdReports;

    event ReportPublished(
        bytes32 indexed rootHash,
        uint256 indexed tokenId,
        address indexed publisher,
        uint64 timestamp
    );

    error AlreadyPublished(bytes32 rootHash);
    error EmptyRootHash();

    function publishReport(
        uint256 tokenId,
        bytes32 rootHash,
        bytes calldata attestation
    ) external {
        if (rootHash == bytes32(0)) revert EmptyRootHash();
        if (reports[rootHash].publisher != address(0)) revert AlreadyPublished(rootHash);

        reports[rootHash] = Report({
            publisher: msg.sender,
            timestamp: uint64(block.timestamp),
            tokenId: tokenId,
            rootHash: rootHash,
            attestation: attestation
        });
        _tokenIdReports[tokenId].push(rootHash);

        emit ReportPublished(rootHash, tokenId, msg.sender, uint64(block.timestamp));
    }

    function reportCount(uint256 tokenId) external view returns (uint256) {
        return _tokenIdReports[tokenId].length;
    }

    function reportAt(uint256 tokenId, uint256 index) external view returns (bytes32) {
        return _tokenIdReports[tokenId][index];
    }

    function reportsFor(uint256 tokenId) external view returns (bytes32[] memory) {
        return _tokenIdReports[tokenId];
    }
}
