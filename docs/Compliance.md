---
layout: default
title: Compliance
nav_order: 2
---

1. TOC
{:toc}

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

