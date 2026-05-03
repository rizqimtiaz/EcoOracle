// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 *                          ╔══════════════════════════╗
 *                          ║    EcoOracle Network      ║
 *                          ║  Carbon Credit dNFT v1.0  ║
 *                          ╚══════════════════════════╝
 *
 *  CarbonCreditDNFT — a dynamic, oracle-updatable ERC-721 representing a single
 *  GPS-bounded parcel of protected land. Each token tracks:
 *
 *    - tonnesCO2  : current verified tonnes of CO₂-equivalent stored
 *    - credits    : fungible credits associated with the token (1 credit = 1t)
 *    - status     : Active / Warning / Invalidated / Regenerating
 *    - lastScan   : timestamp + IPFS CID of the most recent satellite report
 *
 *  Only the EcoOracle (a separate contract / DON) can mutate the dynamic
 *  state. Holders can transferCredits, retireCredits, and read history.
 *
 *  This contract is intentionally compact and audit-friendly. It implements
 *  the minimal ERC-721 surface plus the EcoOracle-specific extensions.
 */
contract CarbonCreditDNFT {
    // -------------------------------------------------------------------------
    // ERC-721 minimal storage
    // -------------------------------------------------------------------------
    string public constant name = "EcoOracle Carbon Credit";
    string public constant symbol = "ECO-CC";

    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => address) public getApproved;
    mapping(address => mapping(address => bool)) public isApprovedForAll;

    // -------------------------------------------------------------------------
    // Dynamic carbon state
    // -------------------------------------------------------------------------
    enum Status { Pending, Active, Warning, Invalidated, Regenerating }

    struct Parcel {
        uint64  hectares;          // hectares (whole numbers — granular enough)
        int64   latE7;             // latitude  * 1e7
        int64   lngE7;             // longitude * 1e7
        uint8   ecosystem;         // 0..7, see EcosystemType in /lib/types.ts
        Status  status;
        uint96  baselineTonnesCO2; // tonnes at minting
        uint96  currentTonnesCO2;  // tonnes per latest oracle update
        uint96  creditsOutstanding;// credits attached to this token
        uint96  creditsRetired;    // credits already retired against this token
        uint64  pricePerCreditE2;  // USD price * 1e2  (e.g. 2350 = $23.50)
        uint64  lastScanAt;        // unix timestamp of last oracle update
        bytes32 lastScanCid;       // IPFS CID prefix of the AI vision report
    }

    mapping(uint256 => Parcel) public parcels;
    mapping(uint256 => mapping(address => uint96)) public creditBalance;

    address public oracle;       // EcoOracle contract address
    address public admin;        // protocol admin (DAO multisig in production)

    uint256 public totalSupply;
    uint256 public globalCreditsRetired;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    event ParcelMinted(uint256 indexed tokenId, address indexed to, uint64 hectares, uint8 ecosystem, uint96 baselineTonnesCO2);
    event OracleStateChanged(uint256 indexed tokenId, Status status, uint96 tonnesCO2, uint96 creditsOutstanding, int128 creditsDelta, uint64 pricePerCreditE2, bytes32 scanCid);
    event Invalidated(uint256 indexed tokenId, string reason, uint96 creditsBurned);
    event CreditsTransferred(uint256 indexed tokenId, address indexed from, address indexed to, uint96 amount);
    event CreditsRetired(uint256 indexed tokenId, address indexed from, uint96 amount, string beneficiary);

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------
    error NotOracle();
    error NotAdmin();
    error NotAuthorized();
    error InvalidatedToken();
    error InsufficientCredits();
    error TokenDoesNotExist();

    modifier onlyOracle() { if (msg.sender != oracle) revert NotOracle(); _; }
    modifier onlyAdmin()  { if (msg.sender != admin)  revert NotAdmin();  _; }

    constructor(address _admin, address _oracle) {
        admin = _admin;
        oracle = _oracle;
    }

    // -------------------------------------------------------------------------
    // Admin / governance
    // -------------------------------------------------------------------------
    function setOracle(address newOracle) external onlyAdmin { oracle = newOracle; }
    function setAdmin (address newAdmin)  external onlyAdmin { admin  = newAdmin;  }

    // -------------------------------------------------------------------------
    // Minting (admin only)
    // -------------------------------------------------------------------------
    function mintCarbonCredit(
        address to,
        uint64  hectares,
        int64   latE7,
        int64   lngE7,
        uint8   ecosystem,
        uint96  baselineTonnesCO2,
        uint96  initialCredits,
        uint64  pricePerCreditE2
    ) external onlyAdmin returns (uint256 tokenId) {
        tokenId = ++totalSupply;
        ownerOf[tokenId] = to;
        balanceOf[to] += 1;
        parcels[tokenId] = Parcel({
            hectares: hectares,
            latE7: latE7,
            lngE7: lngE7,
            ecosystem: ecosystem,
            status: Status.Active,
            baselineTonnesCO2: baselineTonnesCO2,
            currentTonnesCO2: baselineTonnesCO2,
            creditsOutstanding: initialCredits,
            creditsRetired: 0,
            pricePerCreditE2: pricePerCreditE2,
            lastScanAt: uint64(block.timestamp),
            lastScanCid: bytes32(0)
        });
        creditBalance[tokenId][to] = initialCredits;
        emit Transfer(address(0), to, tokenId);
        emit ParcelMinted(tokenId, to, hectares, ecosystem, baselineTonnesCO2);
    }

    // -------------------------------------------------------------------------
    // Oracle updates — the heart of the dNFT pattern
    // -------------------------------------------------------------------------
    /**
     * @notice Apply a verified satellite report to a token.
     * @param tokenId          Token to update
     * @param newStatus        Updated status enum
     * @param newTonnesCO2     New verified tonnes of CO₂e
     * @param creditsDelta     Signed change to creditsOutstanding (e.g. -50, +30)
     * @param newPriceE2       New price in USD * 100
     * @param scanCid          IPFS CID prefix for the report
     */
    function updateCarbonState(
        uint256 tokenId,
        Status  newStatus,
        uint96  newTonnesCO2,
        int128  creditsDelta,
        uint64  newPriceE2,
        bytes32 scanCid
    ) external onlyOracle {
        Parcel storage p = parcels[tokenId];
        if (ownerOf[tokenId] == address(0)) revert TokenDoesNotExist();
        if (p.status == Status.Invalidated && newStatus != Status.Regenerating) {
            revert InvalidatedToken();
        }

        p.status = newStatus;
        p.currentTonnesCO2 = newTonnesCO2;
        p.pricePerCreditE2 = newPriceE2;
        p.lastScanAt = uint64(block.timestamp);
        p.lastScanCid = scanCid;

        address holder = ownerOf[tokenId];
        if (creditsDelta > 0) {
            uint96 add = uint96(uint128(creditsDelta));
            p.creditsOutstanding += add;
            creditBalance[tokenId][holder] += add;
        } else if (creditsDelta < 0) {
            uint96 sub = uint96(uint128(-creditsDelta));
            if (sub > p.creditsOutstanding) sub = p.creditsOutstanding;
            p.creditsOutstanding -= sub;
            uint96 bal = creditBalance[tokenId][holder];
            creditBalance[tokenId][holder] = bal > sub ? bal - sub : 0;
        }

        emit OracleStateChanged(
            tokenId,
            newStatus,
            newTonnesCO2,
            p.creditsOutstanding,
            creditsDelta,
            newPriceE2,
            scanCid
        );
    }

    /**
     * @notice Invalidate a token entirely. Burns all outstanding credits.
     *         Reversible only via governance + a proven regeneration path.
     */
    function invalidate(uint256 tokenId, string calldata reason) external onlyOracle {
        Parcel storage p = parcels[tokenId];
        if (ownerOf[tokenId] == address(0)) revert TokenDoesNotExist();
        uint96 burned = p.creditsOutstanding;
        p.creditsOutstanding = 0;
        p.currentTonnesCO2 = 0;
        p.status = Status.Invalidated;
        p.lastScanAt = uint64(block.timestamp);
        creditBalance[tokenId][ownerOf[tokenId]] = 0;
        emit Invalidated(tokenId, reason, burned);
    }

    // -------------------------------------------------------------------------
    // Credit transfers and retirement
    // -------------------------------------------------------------------------
    function transferCredits(uint256 tokenId, address to, uint96 amount) external {
        if (parcels[tokenId].status == Status.Invalidated) revert InvalidatedToken();
        uint96 bal = creditBalance[tokenId][msg.sender];
        if (bal < amount) revert InsufficientCredits();
        creditBalance[tokenId][msg.sender] = bal - amount;
        creditBalance[tokenId][to] += amount;
        emit CreditsTransferred(tokenId, msg.sender, to, amount);
    }

    function retireCredits(
        uint256 tokenId,
        uint96 amount,
        string calldata beneficiary
    ) external {
        Parcel storage p = parcels[tokenId];
        if (p.status == Status.Invalidated) revert InvalidatedToken();
        uint96 bal = creditBalance[tokenId][msg.sender];
        if (bal < amount) revert InsufficientCredits();
        creditBalance[tokenId][msg.sender] = bal - amount;
        if (amount > p.creditsOutstanding) {
            p.creditsOutstanding = 0;
        } else {
            p.creditsOutstanding -= amount;
        }
        p.creditsRetired += amount;
        globalCreditsRetired += amount;
        emit CreditsRetired(tokenId, msg.sender, amount, beneficiary);
    }

    // -------------------------------------------------------------------------
    // ERC-721 surface (minimal)
    // -------------------------------------------------------------------------
    function approve(address to, uint256 tokenId) external {
        address owner = ownerOf[tokenId];
        if (msg.sender != owner && !isApprovedForAll[owner][msg.sender]) {
            revert NotAuthorized();
        }
        getApproved[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) external {
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        if (ownerOf[tokenId] != from) revert NotAuthorized();
        if (
            msg.sender != from &&
            getApproved[tokenId] != msg.sender &&
            !isApprovedForAll[from][msg.sender]
        ) revert NotAuthorized();

        balanceOf[from] -= 1;
        balanceOf[to]   += 1;
        ownerOf[tokenId] = to;
        getApproved[tokenId] = address(0);

        // Transfer credit balance with the token (atomic for the canonical owner).
        uint96 holderCredits = creditBalance[tokenId][from];
        creditBalance[tokenId][from] = 0;
        creditBalance[tokenId][to] += holderCredits;

        emit Transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        transferFrom(from, to, tokenId);
    }
}
