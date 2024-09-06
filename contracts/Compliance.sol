// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.20;

import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { EIP712Upgradeable } from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { Property } from "./Property.sol";

contract Compliance is Ownable2StepUpgradeable, EIP712Upgradeable {
    using ECDSA for bytes32;

    // Define const default signer duration to be 7 days
    uint256 public constant DEFAULT_SIGNER_DURATION = 7 days;

    // Signers are on a hot wallet, so they are rotated on a weekly basis to optimize the RTO
    address private _identitySigner;
    uint256 private _identitySignerExpiration;
    mapping(address signer => bool isBlacklisted) private _signerBlacklist;

    mapping(address wallet => Identity identity) public identities;
    mapping(uint16 country => bool isBlacklisted) private _countryBlacklist;
    mapping(address wallet => bool isBlacklisted) private _walletBlacklist;

    struct Identity {
        address wallet; // The wallet which is being KYCed
        address signer; // Identity signer that was used, in case it gets blacklisted later
        bytes32 emailHash; // Hash of email used for KYC purposes
        uint256 expiration; // Expiration date of the KYC validation
        uint16 country; // According to https://en.wikipedia.org/wiki/ISO_3166-1_numeric
    }

    // Define custom errors
    error IdentityNotFound(address user);
    error SignerBlacklisted(address user);
    error KYCExpired(address user);
    error CountryBlacklisted(address user);
    error WalletBlacklisted(address user);

    error InvalidSignature();
    error SignatureMismatch();
    error ExpiredSignerKey();

    event IdentityAdded(address wallet, address signer, bytes32 emailHash, uint256 expiration, uint16 country);
    event IdentitySignerUpdated(address signer, uint256 expiration);
    event SignerBlacklistUpdated(address signer, bool isBlacklisted);
    event CountryBlacklistUpdated(uint16 country, bool isBlacklisted);
    event WalletBlacklistUpdated(address wallet, bool isBlacklisted);

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
    function canTransfer(address _from, address _to) external view {
        // get Identity for _from and _to
        Identity memory identityFrom = identities[_from];
        Identity memory identityTo = identities[_to];

        if (_from != address(0)) {
            if (identityFrom.wallet == address(0)) {
                revert IdentityNotFound(_from);
            }
            if (_signerBlacklist[identityFrom.signer]) {
                revert SignerBlacklisted(_from);
            }
            if (block.timestamp >= identityFrom.expiration) {
                revert KYCExpired(_from);
            }
            if (_countryBlacklist[identityFrom.country]) {
                revert CountryBlacklisted(_from);
            }
            if (_walletBlacklist[_from]) {
                revert WalletBlacklisted(_from);
            }
        }

        if (identityTo.wallet == address(0)) {
            revert IdentityNotFound(_to);
        }
        if (_signerBlacklist[identityTo.signer]) {
            revert SignerBlacklisted(_to);
        }
        if (block.timestamp >= identityTo.expiration) {
            revert KYCExpired(_to);
        }
        if (_countryBlacklist[identityTo.country]) {
            revert CountryBlacklisted(_to);
        }
        if (_walletBlacklist[_to]) {
            revert WalletBlacklisted(_to);
        }

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
        if (signer != _identitySigner) {
            revert InvalidSignature();
        }
        if (_identity.signer != signer) {
            revert SignatureMismatch();
        }
        if (block.timestamp >= _identitySignerExpiration) {
            revert ExpiredSignerKey();
        }

        identities[_identity.wallet] = _identity;

        emit IdentityAdded(
            _identity.wallet,
            _identity.signer,
            _identity.emailHash,
            _identity.expiration,
            _identity.country
        );
    }

    function setIdentitySigner(address _signer) external onlyOwner {
        _identitySigner = _signer;
        _identitySignerExpiration = block.timestamp + DEFAULT_SIGNER_DURATION;

        emit IdentitySignerUpdated(_signer, _identitySignerExpiration);
    }

    function blacklistSigner(address _signer, bool isBlacklisted) external onlyOwner {
        _signerBlacklist[_signer] = isBlacklisted;

        emit SignerBlacklistUpdated(_signer, isBlacklisted);
    }

    function blacklistCountry(uint16 _country, bool isBlacklisted) external onlyOwner {
        _countryBlacklist[_country] = isBlacklisted;

        emit CountryBlacklistUpdated(_country, isBlacklisted);
    }

    function blacklistWallet(address _wallet, bool isBlacklisted) external onlyOwner {
        _walletBlacklist[_wallet] = isBlacklisted;

        emit WalletBlacklistUpdated(_wallet, isBlacklisted);
    }
}
