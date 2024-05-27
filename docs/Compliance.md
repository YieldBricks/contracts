<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Solidity API](#solidity-api)
  - [Compliance](#compliance)
    - [DEFAULT_SIGNER_DURATION](#default_signer_duration)
    - [identities](#identities)
    - [Identity](#identity)
    - [IdentityNotFound](#identitynotfound)
    - [SignerBlacklisted](#signerblacklisted)
    - [KYCExpired](#kycexpired)
    - [CountryBlacklisted](#countryblacklisted)
    - [WalletBlacklisted](#walletblacklisted)
    - [InvalidSignature](#invalidsignature)
    - [SignatureMismatch](#signaturemismatch)
    - [ExpiredSignerKey](#expiredsignerkey)
    - [initialize](#initialize)
    - [canTransfer](#cantransfer)
    - [addIdentity](#addidentity)
    - [setIdentitySigner](#setidentitysigner)
    - [blacklistSigner](#blacklistsigner)
    - [blacklistCountry](#blacklistcountry)
    - [blacklistWallet](#blacklistwallet)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Solidity API

## Compliance

### DEFAULT_SIGNER_DURATION

```solidity
uint256 DEFAULT_SIGNER_DURATION
```

### identities

```solidity
mapping(address => struct Compliance.Identity) identities
```

### Identity

```solidity
struct Identity {
  address wallet;
  address signer;
  bytes32 emailHash;
  uint256 expiration;
  uint16 country;
}
```

### IdentityNotFound

```solidity
error IdentityNotFound(address user)
```

### SignerBlacklisted

```solidity
error SignerBlacklisted(address user)
```

### KYCExpired

```solidity
error KYCExpired(address user)
```

### CountryBlacklisted

```solidity
error CountryBlacklisted(address user)
```

### WalletBlacklisted

```solidity
error WalletBlacklisted(address user)
```

### InvalidSignature

```solidity
error InvalidSignature()
```

### SignatureMismatch

```solidity
error SignatureMismatch()
```

### ExpiredSignerKey

```solidity
error ExpiredSignerKey()
```

### initialize

```solidity
function initialize(address identitySigner_, address owner_) public
```

### canTransfer

```solidity
function canTransfer(address _from, address _to) external view
```

### addIdentity

```solidity
function addIdentity(struct Compliance.Identity _identity, bytes signature) external
```

### setIdentitySigner

```solidity
function setIdentitySigner(address _signer) external
```

### blacklistSigner

```solidity
function blacklistSigner(address _signer, bool isBlacklisted) external
```

### blacklistCountry

```solidity
function blacklistCountry(uint16 _country, bool isBlacklisted) external
```

### blacklistWallet

```solidity
function blacklistWallet(address _wallet, bool isBlacklisted) external
```

