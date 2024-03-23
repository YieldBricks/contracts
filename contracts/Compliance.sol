// SPDX-License-Identifier: See LICENSE in root directory
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./Property.sol";

import "hardhat/console.sol";

contract Compliance is Ownable2StepUpgradeable, EIP712Upgradeable {
    using ECDSA for bytes32;

    // Define const default signer duration to be 7 days
    uint256 public constant DEFAULT_SIGNER_DURATION = 7 days;

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
        uint16 country; // According to https://en.wikipedia.org/wiki/ISO_3166-1_numeric
    }

    bytes32 private constant IDENTITY_TYPEHASH =
        keccak256("Identity(address wallet,address signer,bytes32 emailHash,uint256 expiration,uint16 country)");

    function initialize(address identitySigner_, address owner_) public initializer {
        __EIP712_init("Compliance", "1");
        __Ownable2Step_init();
        __Ownable_init(owner_);
        _identitySigner = identitySigner_;
        _identitySignerExpiration = block.timestamp + DEFAULT_SIGNER_DURATION;
    }

    // compliance check and state update
    function canTransfer(address _from, address _to, uint256 _amount) external view {
        // get Identity for _from and _to
        Identity memory identityFrom = identities[_from];
        Identity memory identityTo = identities[_to];

        console.log("canTransferDebug", msg.sender, identityTo.wallet, _to);

        if (_from != address(0)) {
            require(identityFrom.wallet != address(0), "Sender identity not found");
            require(!_signerBlacklist[identityFrom.signer], "Sender signer is blacklisted");
            require(block.timestamp < identityFrom.expiration, "Sender KYC expired");
            require(!_countryBlacklist[identityFrom.country], "Sender country is blacklisted");
            require(!_walletBlacklist[_from], "Sender wallet is blacklisted");
        }

        require(identityTo.wallet != address(0), "Receiver identity not found");
        require(!_signerBlacklist[identityTo.signer], "Receiver signer is blacklisted");
        require(block.timestamp < identityTo.expiration, "Receiver KYC expired");
        require(!_countryBlacklist[identityTo.country], "Receiver country is blacklisted");
        require(!_walletBlacklist[_to], "Receiver wallet is blacklisted");

        // Check if the amount transfered is a significant part of the users supply
        // Token token = Token(msg.sender);
        // uint256 balance = token.balanceOf(_from);
        // require(_amount < balance / 10, "Transfer amount is too high");
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
        require(_identity.signer == signer, "Signature mismatch");
        require(block.timestamp < _identitySignerExpiration, "Expired signer key");

        identities[_identity.wallet] = _identity;
    }

    function setIdentitySigner(address _signer) external onlyOwner {
        _identitySigner = _signer;
        _identitySignerExpiration = block.timestamp + DEFAULT_SIGNER_DURATION;
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
