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

Emitted when a wallet is frozen

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| wallet | address | The address of the wallet that was frozen |

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

### _update

```solidity
function _update(address from, address to, uint256 value) internal
```

### updateStakeValue

```solidity
function updateStakeValue(address user) external
```

### _updateStakeValue

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

## ComplianceV2

### identities

```solidity
mapping(address => struct ComplianceV2.Identity) identities
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

### initialize

```solidity
function initialize(address identitySigner_, address owner_) public
```

### canTransfer

```solidity
function canTransfer(address _from, address _to, uint256 _amount) external view returns (bool)
```

### addIdentity

```solidity
function addIdentity(struct ComplianceV2.Identity _identity, bytes signature) external
```

### setIdentitySigner

```solidity
function setIdentitySigner(address _signer, uint256 duration) external
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

## DenialOfService

### called

```solidity
bool called
```

### receive

```solidity
receive() external payable
```

### buyTokens

```solidity
function buyTokens(address saleManager, address token, uint256 amount) external payable
```

### claimTokens

```solidity
function claimTokens(address saleManager, address token) external
```

### cancelPurchase

```solidity
function cancelPurchase(address saleManager, address token) external
```

## SaleManagerV2

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
mapping(address => struct SaleManagerV2.Sale) sales
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
function buyTokens(uint256 _amount, contract TokenV2 _token) external payable
```

### claimTokens

```solidity
function claimTokens(contract TokenV2 _token) external
```

### cancelPurchase

```solidity
function cancelPurchase(address _token) external
```

## TokenV2

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
function initialize(address compliance_, string name_, string symbol_, uint256 cap_) external
```

### pause

```solidity
function pause() public
```

### unpause

```solidity
function unpause() public
```

### _update

```solidity
function _update(address from, address to, uint256 value) internal
```

### forceTransfer

```solidity
function forceTransfer(address from, address to, uint256 value) public
```

### OwnableUnauthorizedAccount

```solidity
error OwnableUnauthorizedAccount(address sender)
```

### onlyOwner

```solidity
modifier onlyOwner()
```

