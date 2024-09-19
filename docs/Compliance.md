---
layout: default
title: Compliance
nav_order: 2
---

# Solidity API
{: .no_toc }

<details open markdown="block">
  <summary>
    Table of contents
  </summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

## Compliance

_This contract is used to manage compliance for the YieldBricks token._

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

### constructor

```solidity
constructor() public
```

Contract constructor - disabled due to upgradeability

### initialize

```solidity
function initialize(address identitySigner_, address owner_) public
```

_Initialize the contract_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| identitySigner_ | address | The address of the identity signer |
| owner_ | address | The address of the owner |

### canTransfer

```solidity
function canTransfer(address _from, address _to) external view
```

_Check if a transfer can be made_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _from | address | The address from which the tokens are being transferred |
| _to | address | The address to which the tokens are being transferred |

### addIdentity

```solidity
function addIdentity(struct Compliance.Identity _identity, bytes signature) external
```

_Add an identity to the compliance contract_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _identity | struct Compliance.Identity | The identity to add |
| signature | bytes | The signature of the identity |

### setIdentitySigner

```solidity
function setIdentitySigner(address _signer) external
```

_Set the identity signer_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _signer | address | The new identity signer |

### blacklistSigner

```solidity
function blacklistSigner(address _signer, bool isBlacklisted) external
```

_Blacklist or unblacklist a signer_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _signer | address | The signer to blacklist or unblacklist |
| isBlacklisted | bool | True to blacklist, false to unblacklist |

### blacklistCountry

```solidity
function blacklistCountry(uint16 _country, bool isBlacklisted) external
```

_Blacklist or unblacklist a country_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _country | uint16 | The country to blacklist or unblacklist |
| isBlacklisted | bool | True to blacklist, false to unblacklist |

### blacklistWallet

```solidity
function blacklistWallet(address _wallet, bool isBlacklisted) external
```

_Blacklist or unblacklist a wallet_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _wallet | address | The wallet to blacklist or unblacklist |
| isBlacklisted | bool | True to blacklist, false to unblacklist |

### IdentityNotFound

```solidity
error IdentityNotFound(address user)
```

_Error when the identity is not found_

### SignerBlacklisted

```solidity
error SignerBlacklisted(address user)
```

_Error when the signer is blacklisted_

### KYCExpired

```solidity
error KYCExpired(address user)
```

_Error when the KYC has expired_

### CountryBlacklisted

```solidity
error CountryBlacklisted(address user)
```

_Error when the country is blacklisted_

### WalletBlacklisted

```solidity
error WalletBlacklisted(address user)
```

_Error when the wallet is blacklisted_

### InvalidSignature

```solidity
error InvalidSignature()
```

_Error when the signature is invalid_

### SignatureMismatch

```solidity
error SignatureMismatch()
```

_Error when the signature does not match the expected signer_

### ExpiredSignerKey

```solidity
error ExpiredSignerKey()
```

_Error when the signer key is expired_

### IdentityAdded

```solidity
event IdentityAdded(address wallet, address signer, bytes32 emailHash, uint256 expiration, uint16 country)
```

_Emitted when an identity is added_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| wallet | address | The wallet that was added |
| signer | address | The signer of the identity |
| emailHash | bytes32 | The hash of the email used for KYC purposes |
| expiration | uint256 | The expiration date of the KYC validation |
| country | uint16 | The country of the wallet |

### IdentitySignerUpdated

```solidity
event IdentitySignerUpdated(address signer, uint256 expiration)
```

_Emitted when the identity signer is updated_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| signer | address | The new identity signer |
| expiration | uint256 | The expiration date of the new identity signer |

### SignerBlacklistUpdated

```solidity
event SignerBlacklistUpdated(address signer, bool isBlacklisted)
```

_Emitted when a signer is blacklisted or unblacklisted_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| signer | address | The signer that was blacklisted or unblacklisted |
| isBlacklisted | bool | True if the signer was blacklisted, false if it was unblacklisted |

### CountryBlacklistUpdated

```solidity
event CountryBlacklistUpdated(uint16 country, bool isBlacklisted)
```

_Emitted when a country is blacklisted or unblacklisted_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| country | uint16 | The country that was blacklisted or unblacklisted |
| isBlacklisted | bool | True if the country was blacklisted, false if it was unblacklisted |

### WalletBlacklistUpdated

```solidity
event WalletBlacklistUpdated(address wallet, bool isBlacklisted)
```

_Emitted when a wallet is blacklisted or unblacklisted_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| wallet | address | The wallet that was blacklisted or unblacklisted |
| isBlacklisted | bool | True if the wallet was blacklisted, false if it was unblacklisted |

