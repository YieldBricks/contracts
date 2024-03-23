# Solidity API

## Property

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

### initialize

```solidity
function initialize(address compliance_, address saleManager_, string name_, string symbol_, uint256 cap_) external
```

_Initializes the contract by setting a `name`, a `symbol`, a `compliance` contract address, a `saleManager` address,
and a `cap` on the total supply of tokens._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| compliance_ | address | The address of the Compliance contract |
| saleManager_ | address | The address of the SaleManager contract |
| name_ | string | The name of the token |
| symbol_ | string | The symbol of the token |
| cap_ | uint256 | The cap on the total supply of tokens |

### _update

```solidity
function _update(address from, address to, uint256 value) internal
```

_Overrides for ERC20 inheritance chain, with added functionality for freezing wallets and vote self-delegation_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The address to transfer from. |
| to | address | The address to transfer to. |
| value | uint256 | The amount to be transferred. |

### nonces

```solidity
function nonces(address owner) public view returns (uint256)
```

Override the nonces function to return the nonce for a given owner

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | The address of the token holder |

### forceTransfer

```solidity
function forceTransfer(address from, uint256 value) public
```

Allows the owner to force a transfer of tokens from one address to the owner

_The closed nature of the system (only KYCed accounts can transfer) means that even if
a user leaks their private key, a malicious actor cannot send the tokens to an anonymous wallet,
so recovery conditions are very limited, and fully covered by our legal compliance model._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The address to transfer from |
| value | uint256 | The amount to transfer |

### pauseTransfers

```solidity
function pauseTransfers(bool isPaused) public
```

Controls contract pausing, preventing transfers

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

### OwnableUnauthorizedAccount

```solidity
error OwnableUnauthorizedAccount(address sender)
```

### onlyOwner

```solidity
modifier onlyOwner()
```

Throws if called by any account other than the owner.

_This modifier inherits the owner from the Compliance contract for central role management_

