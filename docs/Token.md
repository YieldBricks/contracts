# Solidity API

## Token

### frozen

```solidity
mapping(address => bool) frozen
```

### lastUpdate

```solidity
mapping(address => uint256) lastUpdate
```

### stakeValue

```solidity
mapping(address => uint256) stakeValue
```

### initialize

```solidity
function initialize(address compliance_, address saleManager_, string name_, string symbol_, uint256 cap_) external
```

### pause

```solidity
function pause() public
```

### unpause

```solidity
function unpause() public
```

### \_update

```solidity
function _update(address from, address to, uint256 value) internal
```

### updateStakeValue

```solidity
function updateStakeValue(address user) external
```

### \_updateStakeValue

```solidity
function _updateStakeValue(address user) internal
```

### forceTransfer

```solidity
function forceTransfer(address from, address to, uint256 value) public
```

### freezeWallet

```solidity
function freezeWallet(address wallet, bool isFrozen) public
```

### OwnableUnauthorizedAccount

```solidity
error OwnableUnauthorizedAccount(address sender)
```

### onlyOwner

```solidity
modifier onlyOwner()
```
