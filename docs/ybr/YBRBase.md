---
layout: default
title: ybr/YBRBase
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

## YBRBase

This contract is for the YieldBricks token, which is an ERC20 token with additional features.

### walletFrozen

```solidity
mapping(address => bool) walletFrozen
```

Mapping to track frozen wallets

### constructor

```solidity
constructor() public
```

Contract constructor - disabled due to upgradeability

### __YBR_init

```solidity
function __YBR_init(address owner_) internal
```

Initializes the contract

_This function replaces the constructor for upgradeable contracts._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner_ | address | The initial owner of the contract. |

### _update

```solidity
function _update(address from, address to, uint256 value) internal
```

Overrides the ERC20 _beforeTokenTransfer function to add wallet freezing functionality
as well incorporate the other inherited functions.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The address from which the tokens are being transferred |
| to | address | The address to which the tokens are being transferred |
| value | uint256 | The amount of tokens being transferred |

### forceTransfer

```solidity
function forceTransfer(address from, uint256 value) public
```

Allows the owner to force a transfer of tokens from one address to the owner

_Temporarily added to resolve the Arbitrum Bridge lockup issue_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The address to transfer from |
| value | uint256 | The amount to transfer |

### nonces

```solidity
function nonces(address owner) public view returns (uint256)
```

Override the nonces function to return the nonce for a given owner

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The address of the token holder |

### pauseTransfers

```solidity
function pauseTransfers(bool isPaused) public
```

Pauses the contract, preventing transfers

### freezeWallet

```solidity
function freezeWallet(address wallet, bool isFrozen) public
```

Allows the owner to freeze or unfreeze a wallet

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| wallet | address | The address of the wallet to freeze or unfreeze |
| isFrozen | bool | A boolean indicating whether the wallet should be frozen or unfrozen |

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

| Name | Type | Description |
| ---- | ---- | ----------- |
| wallet | address | The address of the wallet that is frozen |

### WalletFrozen

```solidity
event WalletFrozen(address wallet, bool isFrozen)
```

Event emitted when a wallet is frozen or unfrozen

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| wallet | address | The address of the wallet that was frozen or unfrozen |
| isFrozen | bool | A boolean indicating whether the wallet was frozen or unfrozen |

### PauseTransfers

```solidity
event PauseTransfers(bool isPaused)
```

Event emitted when the contract is paused or unpaused

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| isPaused | bool | A boolean indicating whether the contract was paused or unpaused |

