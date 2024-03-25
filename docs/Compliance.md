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
error IdentityNotFound()
```

### SignerBlacklisted

```solidity
error SignerBlacklisted()
```

### KYCExpired

```solidity
error KYCExpired()
```

### CountryBlacklisted

```solidity
error CountryBlacklisted()
```

### WalletBlacklisted

```solidity
error WalletBlacklisted()
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
function canTransfer(address _from, address _to, uint256 _amount) external view
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

