---
layout: default
title: Property
nav_order: 2
---

{:toc}

# Solidity API

## Property

This contract is for the YieldBricks property, which is a permissioned ERC20 token with additional features.

_This contract externally depends on the Compliance for the `canTransfer` function._

### walletFrozen

```solidity
mapping(address => bool) walletFrozen
```

Mapping to track frozen wallets

### claimNonce

```solidity
mapping(address => uint256) claimNonce
```

Mapping to track how many claims a user has made

### claims

```solidity
struct Property.Yield[] claims
```

Array of claims made by the ownerha

### Yield

```solidity
struct Yield {
  address rewardToken;
  uint256 amount;
  uint256 timestamp;
}
```

### constructor

```solidity
constructor() public
```

Contract constructor - disabled due to upgradeability

### initialize

```solidity
function initialize(address compliance, address saleManager, string name, string symbol, uint256 cap) external
```

_Initializes the contract by setting a `name`, a `symbol`, a `compliance` contract address, a `saleManager` address, and
a `cap` on the total supply of tokens._

#### Parameters

| Name        | Type    | Description                             |
| ----------- | ------- | --------------------------------------- |
| compliance  | address | The address of the Compliance contract  |
| saleManager | address | The address of the SaleManager contract |
| name        | string  | The name of the token                   |
| symbol      | string  | The symbol of the token                 |
| cap         | uint256 | The cap on the total supply of tokens   |

### \_update

```solidity
function _update(address from, address to, uint256 value) internal
```

_Overrides for ERC20 inheritance chain, with added functionality for freezing wallets and vote self-delegation_

#### Parameters

| Name  | Type    | Description                   |
| ----- | ------- | ----------------------------- |
| from  | address | The address to transfer from. |
| to    | address | The address to transfer to.   |
| value | uint256 | The amount to be transferred. |

### nonces

```solidity
function nonces(address owner_) public view returns (uint256)
```

Override the nonces function to return the nonce for a given owner

#### Parameters

| Name    | Type    | Description                     |
| ------- | ------- | ------------------------------- |
| owner\_ | address | The address of the token holder |

### forceTransfer

```solidity
function forceTransfer(address from, uint256 value) public
```

Allows the owner to force a transfer of tokens from one address to the owner

_The closed nature of the system (only KYCed accounts can transfer) means that even if a user leaks their private key, a
malicious actor cannot send the tokens to an anonymous wallet, so recovery conditions are very limited, and fully
covered by our legal compliance model._

#### Parameters

| Name  | Type    | Description                  |
| ----- | ------- | ---------------------------- |
| from  | address | The address to transfer from |
| value | uint256 | The amount to transfer       |

### pauseTransfers

```solidity
function pauseTransfers(bool isPaused) public
```

Controls contract pausing, preventing transfers

### addYield

```solidity
function addYield(address rewardToken, uint256 amount, uint256 timestamp) public
```

Allows the owner to add a claim to the contract

#### Parameters

| Name        | Type    | Description                     |
| ----------- | ------- | ------------------------------- |
| rewardToken | address | The address of the reward token |
| amount      | uint256 | The amount of the reward token  |
| timestamp   | uint256 | The timestamp of the claim      |

### collectYields

```solidity
function collectYields() external
```

Allows Property token holders to collect their property yield

_This function is gas-optimized to allow for a large number of claims to be processed in a single transaction. The owner
can add claims to the contract, and then users can collect their claims in batches of X at a time. The claim amount is
proportional to the user's holdings at the time of the claim._

### freezeWallet

```solidity
function freezeWallet(address wallet, bool isFrozen) public
```

Allows the owner to freeze or unfreeze a wallet

#### Parameters

| Name     | Type    | Description                                                          |
| -------- | ------- | -------------------------------------------------------------------- |
| wallet   | address | The address of the wallet to freeze or unfreeze                      |
| isFrozen | bool    | A boolean indicating whether the wallet should be frozen or unfrozen |

### onlyOwner

```solidity
modifier onlyOwner()
```

Throws if called by any account other than the owner.

_This modifier inherits the owner from the Compliance contract for central role management_

### owner

```solidity
function owner() public view returns (address)
```

Passthrough the for owner() function from the Compliance contract, since the owner is inherited

### clock

```solidity
function clock() public view returns (uint48)
```

Returns the current time as a uint48

_Override for ERC20Votes clock functionality_

### CLOCK_MODE

```solidity
function CLOCK_MODE() public view returns (string)
```

Returns the EIP6372 clock mode

_Override for ERC20Votes clock functionality_

### FrozenWalletError

```solidity
error FrozenWalletError(address wallet)
```

Error when a wallet is frozen

#### Parameters

| Name   | Type    | Description                               |
| ------ | ------- | ----------------------------------------- |
| wallet | address | The address of the wallet that was frozen |

### OwnableUnauthorizedAccount

```solidity
error OwnableUnauthorizedAccount(address sender)
```

### WalletFrozen

```solidity
event WalletFrozen(address wallet, bool isFrozen)
```

### PauseTransfers

```solidity
event PauseTransfers(bool isPaused)
```

### YieldAdded

```solidity
event YieldAdded(uint256 transactionId, address rewardToken, uint256 amount)
```

### YieldCollected

```solidity
event YieldCollected(address user, address rewardToken, uint256 amount)
```
