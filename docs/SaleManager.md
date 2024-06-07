---
layout: default
title: SaleManager.md
nav_order: 2
---

{:toc}

# Solidity API

## SaleManager

_This contract manages the sales of tokens. It allows the owner to create tokens, create sales for those tokens, and edit sales. It also allows users to buy tokens and claim or cancel their purchases._

### TokenDeployed

```solidity
event TokenDeployed(address property, string name, string symbol, uint256 cap, address compliance)
```

_Emitted when a new token is deployed._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| property | address | The address of the new token. |
| name | string | The name of the new token. |
| symbol | string | The symbol of the new token. |
| cap | uint256 | The cap of the new token. |
| compliance | address | The compliance address of the new token. |

### SaleCreated

```solidity
event SaleCreated(address property, uint256 start, uint256 end, uint256 price)
```

_Emitted when a new sale is created._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| property | address | The address of the token for which the sale is created. |
| start | uint256 | The start time of the sale. |
| end | uint256 | The end time of the sale. |
| price | uint256 | The price of the token in the sale. |

### SaleModified

```solidity
event SaleModified(address property, uint256 start, uint256 end, uint256 price)
```

_Emitted when a sale is modified._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| property | address | The address of the token for which the sale is modified. |
| start | uint256 | The new start time of the sale. |
| end | uint256 | The new end time of the sale. |
| price | uint256 | The new price of the token in the sale. |

### ClaimAdded

```solidity
event ClaimAdded(uint256 transactionId, address sender, uint256 amount)
```

_Emitted when a claim is added._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| transactionId | uint256 | The ID of the transaction. |
| sender | address | The address of the sender of the transaction. |
| amount | uint256 | The amount of the transaction. |

### Sale

_Struct representing a sale._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Sale {
  uint256 start;
  uint256 end;
  uint256 price;
}
```

### sales

```solidity
mapping(address => struct SaleManager.Sale) sales
```

_Mapping of token addresses to their respective sales._

### unclaimedByUser

```solidity
mapping(address => struct SaleManager.Unclaimed[]) unclaimedByUser
```

_Mapping of users to their unclaimed tokens._

### unclaimedProperties

```solidity
mapping(address => uint256) unclaimedProperties
```

_Mapping of token addresses to their unclaimed properties._

### whitelistedPaymentTokens

```solidity
mapping(address => bool) whitelistedPaymentTokens
```

_Mapping of payment tokens to their whitelist status._

### Unclaimed

_Struct representing unclaimed tokens._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Unclaimed {
  address propertyAddress;
  address paymentTokenAddress;
  uint256 propertyAmount;
  uint256 paymentTokenAmount;
}
```

### tokenAddresses

```solidity
address[] tokenAddresses
```

_Array of token addresses._

### tokenBeacon

```solidity
contract UpgradeableBeacon tokenBeacon
```

_Beacon for upgradeable tokens._

### oracle

```solidity
contract IOracle oracle
```

_Oracle for price feeds._

### initialize

```solidity
function initialize(address tokenBeacon_, address owner_, address oracle_) public
```

_Initializes the contract._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenBeacon_ | address | The address of the token beacon. |
| owner_ | address | The address of the owner. |
| oracle_ | address | The address of the oracle. |

### createToken

```solidity
function createToken(string name_, string symbol_, uint256 cap_, address compliance_) external
```

_Creates a new token._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name_ | string | The name of the new token. |
| symbol_ | string | The symbol of the new token. |
| cap_ | uint256 | The cap of the new token. |
| compliance_ | address | The compliance address of the new token. |

### createSale

```solidity
function createSale(address _token, uint256 _start, uint256 _end, uint256 _price) external
```

_Creates a new sale for a token._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _token | address | The address of the token for which the sale is created. |
| _start | uint256 | The start time of the sale. |
| _end | uint256 | The end time of the sale. |
| _price | uint256 | The price of the token in the sale. |

### editSale

```solidity
function editSale(address _token, uint256 _start, uint256 _end, uint256 _price) external
```

_Edits an existing sale for a token._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _token | address | The address of the token for which the sale is edited. |
| _start | uint256 | The new start time of the sale. |
| _end | uint256 | The new end time of the sale. |
| _price | uint256 | The new price of the token in the sale. |

### withdrawFunds

```solidity
function withdrawFunds(address _token) external
```

_Withdraws funds from the contract._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _token | address | The address of the token to withdraw. |

### setOracle

```solidity
function setOracle(address oracle_) external
```

_Sets a new oracle for the contract._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| oracle_ | address | The address of the new oracle. |

### whitelistPaymentToken

```solidity
function whitelistPaymentToken(address paymentToken, bool isWhitelisted) external
```

_Whitelists a payment token._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| paymentToken | address | The address of the payment token. |
| isWhitelisted | bool | The new whitelist status of the payment token. |

### buyTokens

```solidity
function buyTokens(uint256 _amount, address paymentTokenAddress, address _property) external
```

_Allows user to buy tokens._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _amount | uint256 | The amount of tokens to buy. |
| paymentTokenAddress | address | The address of the payment token. |
| _property | address | The address of the token to buy. |

### claimTokens

```solidity
function claimTokens() external
```

_Allows user to claim unclaimed tokens._

### cancelPurchases

```solidity
function cancelPurchases() external
```

_Cancels purchases and refunds 80% of the payment token._

### NoUnclaimedTokens

```solidity
error NoUnclaimedTokens(address user)
```

_This error is thrown when a user tries to claim tokens but there are no unclaimed tokens associated with their address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user who is trying to claim tokens. |

### SaleNotStarted

```solidity
error SaleNotStarted(address property)
```

_This error is thrown when a user tries to buy tokens from a sale that has not started yet._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| property | address | The address of the property whose sale has not started. |

### SaleEnded

```solidity
error SaleEnded(address property)
```

_This error is thrown when a user tries to buy tokens from a sale that has already ended._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| property | address | The address of the property whose sale has ended. |

### NotEnoughTokensLeft

```solidity
error NotEnoughTokensLeft()
```

_This error is thrown when a user tries to buy more tokens than are available in the sale._

### PaymentTokenNotWhitelisted

```solidity
error PaymentTokenNotWhitelisted(address paymentToken)
```

_This error is thrown when a user tries to buy tokens using a payment token that is not whitelisted._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| paymentToken | address | The address of the payment token that is not whitelisted. |

### InsufficientAllowance

```solidity
error InsufficientAllowance()
```

_This error is thrown when a user does not have enough allowance to buy the desired amount of tokens._

