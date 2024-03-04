// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./TokenV2.sol";

contract ComplianceV2 is Ownable2StepUpgradeable, EIP712Upgradeable {
    using ECDSA for bytes32;

    // Signers are on a hot wallet, so they are rotated on a weekly basis to optimize the RTO
    address private _identitySigner;
    uint256 private _identitySignerExpiration;
    mapping(address => bool) private _signerBlacklist;

    mapping(address => Identity) public identities;
    mapping(uint16 => bool) private _countryBlacklist;
    mapping(address => bool) private _walletBlacklist;

    struct Identity {
        address wallet; // The wallet which is being KYCed
        address signer; // Identity signer that was used, in case it gets blacklisted later
        bytes32 emailHash; // Hash of email used for KYC purposes
        uint256 expiration; // Expiration date of the KYC validation
        uint16 country; // According to https://en.wikipedia.org/wiki/ISO_3166-1_numeric#Officially_assigned_code_elements
    }

    bytes32 private constant IDENTITY_TYPEHASH =
        keccak256("Identity(address wallet,address signer,bytes32 emailHash,uint256 expiration,uint16 country)");

    function initialize(address identitySigner_, address owner_) public initializer {
        __EIP712_init("Compliance", "1");
        __Ownable2Step_init();
        __Ownable_init(owner_);
        _identitySigner = identitySigner_;
    }

    // compliance check and state update
    function canTransfer(address _from, address _to, uint256 _amount) external view returns (bool) {
        // get Identity for _from and _to
        Identity memory identityFrom = identities[_from];
        Identity memory identitiyTo = identities[_to];

        // Check if signer is blacklisted
        require(!_signerBlacklist[identityFrom.signer], "Signer is blacklisted");
        require(!_signerBlacklist[identitiyTo.signer], "Signer is blacklisted");

        // Check if KYC expired
        require(block.timestamp < identityFrom.expiration, "KYC expired");
        require(block.timestamp < identitiyTo.expiration, "KYC expired");

        // Check if country is blacklisted
        require(!_countryBlacklist[identityFrom.country], "Sender country is blacklisted");
        require(!_countryBlacklist[identitiyTo.country], "Receiver country is blacklisted");

        // Check if wallet is blacklisted
        require(!_walletBlacklist[_from], "Sender wallet is blacklisted");
        require(!_walletBlacklist[_to], "Receiver wallet is blacklisted");

        // Check if the amount transfered is a significant part of the users supply
        TokenV2 token = TokenV2(msg.sender);
        uint256 balance = token.balanceOf(_from);
        require(_amount < balance / 10, "Transfer amount is too high");

        return true;
    }

    function addIdentity(Identity memory _identity, bytes memory signature) external {
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    IDENTITY_TYPEHASH,
                    _identity.wallet,
                    _identity.signer,
                    _identity.emailHash,
                    _identity.expiration,
                    _identity.country
                )
            )
        );
        address signer = ECDSA.recover(digest, signature);
        require(signer == _identitySigner, "Invalid signature");
        require(block.timestamp < _identitySignerExpiration, "Expired signer key");
        identities[_identity.wallet] = _identity;
    }

    function setIdentitySigner(address _signer, uint256 duration) external onlyOwner {
        _identitySigner = _signer;
        _identitySignerExpiration = block.timestamp + duration;
    }

    function blacklistSigner(address _signer, bool isBlacklisted) external onlyOwner {
        _signerBlacklist[_signer] = isBlacklisted;
    }

    function blacklistCountry(uint16 _country, bool isBlacklisted) external onlyOwner {
        _countryBlacklist[_country] = isBlacklisted;
    }

    function blacklistWallet(address _wallet, bool isBlacklisted) external onlyOwner {
        _walletBlacklist[_wallet] = isBlacklisted;
    }
}
