# Solidity API

## YBR

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

### initialize

```solidity
function initialize(address owner_) external
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

### WalletFrozen

```solidity
error WalletFrozen(address wallet)
```

Error when a wallet is frozen

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| wallet | address | The address of the wallet that is frozen |

