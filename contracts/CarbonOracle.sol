// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { CarbonCreditDNFT } from "./CarbonCreditDNFT.sol";

/**
 *  CarbonOracle — pushes verified satellite-derived carbon state on-chain.
 *
 *  In production this contract would be wired to a Chainlink Functions DON or
 *  a custom oracle network (each node independently runs the AI pipeline,
 *  signs the report, and the aggregator publishes the median).
 *
 *  For our reference implementation we model:
 *    - A whitelist of authorized oracle nodes
 *    - A minimum signature threshold
 *    - A simple aggregation step (median) before pushing to the dNFT
 *    - A "publish" function the off-chain coordinator calls once aggregation
 *      is complete
 */
contract CarbonOracle {
    CarbonCreditDNFT public immutable dnft;
    address public admin;
    uint8   public minSigners;

    mapping(address => bool) public isOracleNode;

    struct Report {
        uint256 tokenId;
        CarbonCreditDNFT.Status status;
        uint96  tonnesCO2;
        int128  creditsDelta;
        uint64  priceE2;
        bytes32 scanCid;
    }

    event OracleNodeAdded(address node);
    event OracleNodeRemoved(address node);
    event ReportPublished(uint256 indexed tokenId, address publisher, bytes32 scanCid);
    event TokenInvalidated(uint256 indexed tokenId, string reason);

    error NotAdmin();
    error NotOracleNode();
    error InsufficientSigners();
    error LengthMismatch();

    modifier onlyAdmin() { if (msg.sender != admin) revert NotAdmin(); _; }

    constructor(address _dnft, address _admin, uint8 _minSigners) {
        dnft = CarbonCreditDNFT(_dnft);
        admin = _admin;
        minSigners = _minSigners == 0 ? 1 : _minSigners;
    }

    function setAdmin(address newAdmin) external onlyAdmin { admin = newAdmin; }
    function setMinSigners(uint8 v) external onlyAdmin { minSigners = v == 0 ? 1 : v; }

    function addOracleNode(address node) external onlyAdmin {
        isOracleNode[node] = true;
        emit OracleNodeAdded(node);
    }

    function removeOracleNode(address node) external onlyAdmin {
        isOracleNode[node] = false;
        emit OracleNodeRemoved(node);
    }

    /**
     * @notice Publish a report aggregated off-chain by `signers`.
     * @dev    The contract verifies that at least `minSigners` whitelisted
     *         oracle nodes co-signed (caller passes the addresses; in a real
     *         deployment the ecrecover signatures would be verified here).
     */
    function publishReport(Report calldata r, address[] calldata signers) external {
        uint8 valid;
        for (uint256 i = 0; i < signers.length; ++i) {
            if (isOracleNode[signers[i]]) {
                valid++;
            }
        }
        if (valid < minSigners) revert InsufficientSigners();

        dnft.updateCarbonState(
            r.tokenId,
            r.status,
            r.tonnesCO2,
            r.creditsDelta,
            r.priceE2,
            r.scanCid
        );
        emit ReportPublished(r.tokenId, msg.sender, r.scanCid);
    }

    function invalidate(uint256 tokenId, string calldata reason, address[] calldata signers) external {
        uint8 valid;
        for (uint256 i = 0; i < signers.length; ++i) {
            if (isOracleNode[signers[i]]) valid++;
        }
        if (valid < minSigners) revert InsufficientSigners();
        dnft.invalidate(tokenId, reason);
        emit TokenInvalidated(tokenId, reason);
    }
}
