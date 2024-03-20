# Solidity API

## SaleManager

### TokenDeployed

```solidity
event TokenDeployed(address token, string name, string symbol, uint256 cap, address compliance)
```

### SaleCreated

```solidity
event SaleCreated(address token, uint256 start, uint256 end, uint256 price)
```

### SaleModified

```solidity
event SaleModified(address token, uint256 start, uint256 end, uint256 price)
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

### unclaimedTokensByUserByToken

```solidity
mapping(address => mapping(address => uint256)) unclaimedTokensByUserByToken
```

### unclaimedTokensByToken

```solidity
mapping(address => uint256) unclaimedTokensByToken
```

### tokenAddresses

```solidity
address[] tokenAddresses
```

### tokenBeacon

```solidity
contract UpgradeableBeacon tokenBeacon
```

### initialize

```solidity
function initialize(address tokenBeacon_, address owner_) public
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

### buyTokens

```solidity
function buyTokens(uint256 _amount, contract Token _token) external payable
```

### claimTokens

```solidity
function claimTokens(contract Token _token) external
```

### cancelPurchase

```solidity
function cancelPurchase(contract Token _token) external
```

