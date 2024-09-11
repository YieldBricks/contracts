// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.20;

import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { EIP712Upgradeable } from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title Compliance Contract
 * @dev This contract is used to manage compliance for the YieldBricks token.
 */
contract Compliance is Ownable2StepUpgradeable, EIP712Upgradeable {
    using ECDSA for bytes32;

    // Define const default signer duration to be 180 days
    uint256 public constant DEFAULT_SIGNER_DURATION = 180 days;

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

    // Define EIP712 types
    bytes32 private constant IDENTITY_TYPEHASH =
        keccak256("Identity(address wallet,address signer,bytes32 emailHash,uint256 expiration,uint16 country)");

    /**
     * @dev Initialize the contract
     * @param identitySigner_ The address of the identity signer
     * @param owner_ The address of the owner
     */
    function initialize(address identitySigner_, address owner_) public initializer {
        __EIP712_init("Compliance", "1");
        __Ownable2Step_init();
        __Ownable_init(owner_);
        _identitySigner = identitySigner_;
        _identitySignerExpiration = block.timestamp + DEFAULT_SIGNER_DURATION;
    }

    /**
     * @dev Check if a transfer can be made
     * @param _from The address from which the tokens are being transferred
     * @param _to The address to which the tokens are being transferred
     */
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
    }

    /**
     * @dev Add an identity to the compliance contract
     * @param _identity The identity to add
     * @param signature The signature of the identity
     */
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

    /**
     * @dev Set the identity signer
     * @param _signer The new identity signer
     */
    function setIdentitySigner(address _signer) external onlyOwner {
        _identitySigner = _signer;
        _identitySignerExpiration = block.timestamp + DEFAULT_SIGNER_DURATION;

        emit IdentitySignerUpdated(_signer, _identitySignerExpiration);
    }

    /**
     * @dev Blacklist or unblacklist a signer
     * @param _signer The signer to blacklist or unblacklist
     * @param isBlacklisted True to blacklist, false to unblacklist
     */
    function blacklistSigner(address _signer, bool isBlacklisted) external onlyOwner {
        _signerBlacklist[_signer] = isBlacklisted;

        emit SignerBlacklistUpdated(_signer, isBlacklisted);
    }

    /**
     * @dev Blacklist or unblacklist a country
     * @param _country The country to blacklist or unblacklist
     * @param isBlacklisted True to blacklist, false to unblacklist
     */
    function blacklistCountry(uint16 _country, bool isBlacklisted) external onlyOwner {
        _countryBlacklist[_country] = isBlacklisted;

        emit CountryBlacklistUpdated(_country, isBlacklisted);
    }

    /**
     * @dev Blacklist or unblacklist a wallet
     * @param _wallet The wallet to blacklist or unblacklist
     * @param isBlacklisted True to blacklist, false to unblacklist
     */
    function blacklistWallet(address _wallet, bool isBlacklisted) external onlyOwner {
        _walletBlacklist[_wallet] = isBlacklisted;

        emit WalletBlacklistUpdated(_wallet, isBlacklisted);
    }

    /**
     * @dev Error when the identity is not found
     */
    error IdentityNotFound(address user);

    /**
     * @dev Error when the signer is blacklisted
     */
    error SignerBlacklisted(address user);

    /**
     * @dev Error when the KYC has expired
     */
    error KYCExpired(address user);

    /**
     * @dev Error when the country is blacklisted
     */
    error CountryBlacklisted(address user);

    /**
     * @dev Error when the wallet is blacklisted
     */
    error WalletBlacklisted(address user);

    /**
     * @dev Error when the signature is invalid
     */
    error InvalidSignature();

    /**
     * @dev Error when the signature does not match the expected signer
     */
    error SignatureMismatch();

    /**
     * @dev Error when the signer key is expired
     */
    error ExpiredSignerKey();

    /**
     * @dev Emitted when an identity is added
     * @param wallet The wallet that was added
     * @param signer The signer of the identity
     * @param emailHash The hash of the email used for KYC purposes
     * @param expiration The expiration date of the KYC validation
     * @param country The country of the wallet
     */
    event IdentityAdded(address wallet, address signer, bytes32 emailHash, uint256 expiration, uint16 country);

    /**
     * @dev Emitted when the identity signer is updated
     * @param signer The new identity signer
     * @param expiration The expiration date of the new identity signer
     */
    event IdentitySignerUpdated(address signer, uint256 expiration);

    /**
     * @dev Emitted when a signer is blacklisted or unblacklisted
     * @param signer The signer that was blacklisted or unblacklisted
     * @param isBlacklisted True if the signer was blacklisted, false if it was unblacklisted
     */
    event SignerBlacklistUpdated(address signer, bool isBlacklisted);

    /**
     * @dev Emitted when a country is blacklisted or unblacklisted
     * @param country The country that was blacklisted or unblacklisted
     * @param isBlacklisted True if the country was blacklisted, false if it was unblacklisted
     */
    event CountryBlacklistUpdated(uint16 country, bool isBlacklisted);

    /**
     * @dev Emitted when a wallet is blacklisted or unblacklisted
     * @param wallet The wallet that was blacklisted or unblacklisted
     * @param isBlacklisted True if the wallet was blacklisted, false if it was unblacklisted
     */
    event WalletBlacklistUpdated(address wallet, bool isBlacklisted);
}
