// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title LPDoctorAgent
/// @notice ERC-7857-style intelligent NFT for the LPDoctor agent itself.
///         A single iNFT mint represents the agent's on-chain identity.
///         The agent updates its `memoryRoot` (rootHash of its persistent
///         memory DAG on 0G Storage) and its `reputation` (running counter
///         of diagnoses successfully published) over its lifetime. Owners
///         of the iNFT can transfer it to delegate operation of the agent.
///
///         Other agents may pay to call the agent via `mintLicense`. The
///         payment is split between the iNFT owner (configurable share)
///         and the protocol treasury (the rest). MCP tools enforce the
///         license check via `isLicensed`.
///
///         This is a minimal reference impl — not the full ERC-7857
///         standard. The fields modeled are the load-bearing ones for the
///         OpenAgents demo: identity, memory pointer, reputation counter,
///         migration counter, paid licensing.
contract LPDoctorAgent {
    string public constant NAME = "LP Doctor Agent";
    string public constant SYMBOL = "LPDOC";

    struct Agent {
        address owner;
        bytes32 memoryRoot;       // rootHash on 0G Storage
        bytes32 codeImageHash;    // docker image hash for the TEE enclave
        uint64 mintedAt;
        uint64 lastUpdatedAt;
        uint64 reputation;        // diagnoses anchored count
        uint64 migrationsTriggered; // permit2 migrations recorded count
        string metadataUri;       // ipfs:// or og://...
    }

    struct License {
        uint64 expiresAt;
        uint256 paid;
    }

    mapping(uint256 => Agent) public agents;
    mapping(address => uint256) public agentOf;
    mapping(uint256 => mapping(address => License)) public licenses;
    uint256 public nextTokenId = 1;

    // Royalty split is fixed at construction. `protocolFeeBps` of every
    // mintLicense payment goes to `protocolTreasury`; the rest goes to
    // the iNFT owner. 10_000 bps = 100 %.
    address public immutable protocolTreasury;
    uint16 public immutable protocolFeeBps;

    event AgentMinted(
        uint256 indexed tokenId,
        address indexed owner,
        bytes32 codeImageHash,
        string metadataUri
    );
    event MemoryRootUpdated(uint256 indexed tokenId, bytes32 oldRoot, bytes32 newRoot);
    event ReputationIncremented(uint256 indexed tokenId, uint64 newReputation);
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
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    error NotOwner();
    error AlreadyMinted();
    error UnknownToken();
    error NoPayment();
    error InvalidExpiry();
    error InvalidTreasury();
    error FeeTooHigh();
    error PayoutFailed();

    constructor(address protocolTreasury_, uint16 protocolFeeBps_) {
        if (protocolTreasury_ == address(0)) revert InvalidTreasury();
        if (protocolFeeBps_ > 10_000) revert FeeTooHigh();
        protocolTreasury = protocolTreasury_;
        protocolFeeBps = protocolFeeBps_;
    }

    function mint(
        bytes32 codeImageHash,
        string calldata metadataUri
    ) external returns (uint256 tokenId) {
        if (agentOf[msg.sender] != 0) revert AlreadyMinted();
        tokenId = nextTokenId++;
        agents[tokenId] = Agent({
            owner: msg.sender,
            memoryRoot: bytes32(0),
            codeImageHash: codeImageHash,
            mintedAt: uint64(block.timestamp),
            lastUpdatedAt: uint64(block.timestamp),
            reputation: 0,
            migrationsTriggered: 0,
            metadataUri: metadataUri
        });
        agentOf[msg.sender] = tokenId;
        emit AgentMinted(tokenId, msg.sender, codeImageHash, metadataUri);
        emit Transfer(address(0), msg.sender, tokenId);
    }

    function updateMemoryRoot(uint256 tokenId, bytes32 newRoot) external {
        Agent storage a = agents[tokenId];
        if (a.owner == address(0)) revert UnknownToken();
        if (a.owner != msg.sender) revert NotOwner();
        bytes32 oldRoot = a.memoryRoot;
        a.memoryRoot = newRoot;
        a.lastUpdatedAt = uint64(block.timestamp);
        emit MemoryRootUpdated(tokenId, oldRoot, newRoot);
    }

    function recordDiagnose(uint256 tokenId) external {
        Agent storage a = agents[tokenId];
        if (a.owner == address(0)) revert UnknownToken();
        if (a.owner != msg.sender) revert NotOwner();
        unchecked { a.reputation += 1; }
        a.lastUpdatedAt = uint64(block.timestamp);
        emit ReputationIncremented(tokenId, a.reputation);
    }

    /// @notice Records that the user signed the Permit2 migration bundle the
    ///         agent assembled. The digest is the EIP-712 hash of the signed
    ///         PermitSingle — embedding it on-chain proves the agent's output
    ///         led to a real (signed) user action, not just a diagnosis.
    ///         Owner-gated because migrations are recorded by the agent
    ///         operator after it sees a valid signature client-side.
    function recordMigration(uint256 tokenId, bytes32 permit2Digest) external {
        Agent storage a = agents[tokenId];
        if (a.owner == address(0)) revert UnknownToken();
        if (a.owner != msg.sender) revert NotOwner();
        unchecked { a.migrationsTriggered += 1; }
        a.lastUpdatedAt = uint64(block.timestamp);
        emit MigrationRecorded(tokenId, permit2Digest, a.migrationsTriggered);
    }

    /// @notice Buys a time-bounded license to call the agent (via MCP or
    ///         directly). Royalty splits the payment between iNFT owner
    ///         and protocol treasury per `protocolFeeBps`.
    function mintLicense(
        uint256 tokenId,
        address licensee,
        uint64 expiresAt
    ) external payable {
        Agent storage a = agents[tokenId];
        if (a.owner == address(0)) revert UnknownToken();
        if (msg.value == 0) revert NoPayment();
        if (expiresAt <= block.timestamp) revert InvalidExpiry();

        uint256 protocolCut = (msg.value * protocolFeeBps) / 10_000;
        uint256 ownerCut = msg.value - protocolCut;

        licenses[tokenId][licensee] = License({
            expiresAt: expiresAt,
            paid: msg.value
        });

        (bool ok1, ) = a.owner.call{value: ownerCut}("");
        if (!ok1) revert PayoutFailed();
        if (protocolCut > 0) {
            (bool ok2, ) = protocolTreasury.call{value: protocolCut}("");
            if (!ok2) revert PayoutFailed();
        }

        emit LicenseMinted(tokenId, licensee, expiresAt, msg.value, ownerCut, protocolCut);
    }

    /// @notice True if `caller` may invoke the agent for `tokenId`. Owner is
    ///         always licensed; other addresses must hold a non-expired
    ///         license.
    function isLicensed(uint256 tokenId, address caller) external view returns (bool) {
        Agent storage a = agents[tokenId];
        if (a.owner == address(0)) return false;
        if (caller == a.owner) return true;
        return licenses[tokenId][caller].expiresAt > block.timestamp;
    }

    function transferAgent(uint256 tokenId, address to) external {
        Agent storage a = agents[tokenId];
        if (a.owner == address(0)) revert UnknownToken();
        if (a.owner != msg.sender) revert NotOwner();
        address prev = a.owner;
        agentOf[prev] = 0;
        a.owner = to;
        agentOf[to] = tokenId;
        emit Transfer(prev, to, tokenId);
    }

    function memoryRootOf(uint256 tokenId) external view returns (bytes32) {
        return agents[tokenId].memoryRoot;
    }
}
