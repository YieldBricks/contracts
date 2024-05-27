<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Solidity API](#solidity-api)
  - [SaleManager](#salemanager)
    - [TokenDeployed](#tokendeployed)
    - [SaleCreated](#salecreated)
    - [SaleModified](#salemodified)
    - [ClaimAdded](#claimadded)
    - [Sale](#sale)
    - [sales](#sales)
    - [unclaimedByUser](#unclaimedbyuser)
    - [unclaimedProperties](#unclaimedproperties)
    - [whitelistedPaymentTokens](#whitelistedpaymenttokens)
    - [Unclaimed](#unclaimed)
    - [tokenAddresses](#tokenaddresses)
    - [tokenBeacon](#tokenbeacon)
    - [oracle](#oracle)
    - [initialize](#initialize)
    - [createToken](#createtoken)
    - [createSale](#createsale)
    - [editSale](#editsale)
    - [withdrawFunds](#withdrawfunds)
    - [setOracle](#setoracle)
    - [whitelistPaymentToken](#whitelistpaymenttoken)
    - [buyTokens](#buytokens)
    - [claimTokens](#claimtokens)
    - [cancelPurchases](#cancelpurchases)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Solidity API

## SaleManager

### TokenDeployed

```solidity
event TokenDeployed(address property, string name, string symbol, uint256 cap, address compliance)
```

### SaleCreated

```solidity
event SaleCreated(address property, uint256 start, uint256 end, uint256 price)
```

### SaleModified

```solidity
event SaleModified(address property, uint256 start, uint256 end, uint256 price)
```

### ClaimAdded

```solidity
event ClaimAdded(uint256 transactionId, address sender, uint256 amount)
```

### Sale

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

### unclaimedByUser

```solidity
mapping(address => struct SaleManager.Unclaimed[]) unclaimedByUser
```

### unclaimedProperties

```solidity
mapping(address => uint256) unclaimedProperties
```

### whitelistedPaymentTokens

```solidity
mapping(address => bool) whitelistedPaymentTokens
```

### Unclaimed

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

### tokenBeacon

```solidity
contract UpgradeableBeacon tokenBeacon
```

### oracle

```solidity
contract IOracle oracle
```

### initialize

```solidity
function initialize(address tokenBeacon_, address owner_, address oracle_) public
```

### createToken

```solidity
function createToken(string name_, string symbol_, uint256 cap_, address compliance_) external
```

### createSale

```solidity
function createSale(address _token, uint256 _start, uint256 _end, uint256 _price) external
```

### editSale

```solidity
function editSale(address _token, uint256 _start, uint256 _end, uint256 _price) external
```

### withdrawFunds

```solidity
function withdrawFunds(address _token) external
```

### setOracle

```solidity
function setOracle(address oracle_) external
```

### whitelistPaymentToken

```solidity
function whitelistPaymentToken(address paymentToken, bool isWhitelisted) external
```

### buyTokens

```solidity
function buyTokens(uint256 _amount, address paymentTokenAddress, address _property) external payable
```

### claimTokens

```solidity
function claimTokens() external
```

### cancelPurchases

```solidity
function cancelPurchases() external
```

