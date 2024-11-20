---
layout: default
title: Escrow
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

## Escrow

_The Escrow contract allows users to contribute to escrow pools._

### ybr

```solidity
contract IERC20 ybr
```

### usdt

```solidity
contract IERC20 usdt
```

### EscrowPool

_Struct representing an escrow pool._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct EscrowPool {
  uint256 contributionStart;
  uint256 contributionEnd;
  uint256 timeToMaturity;
  uint256 liquidityLimit;
  uint256 collateral;
  uint256 expectedYield;
  bool cancelled;
}
```

### escrowPools

```solidity
struct Escrow.EscrowPool[] escrowPools
```

_Escrow pool array._

### poolContributions

```solidity
mapping(uint256 => uint256) poolContributions
```

_Mapping of pool index to the pool's total contribution._

### userContributions

```solidity
mapping(uint256 => mapping(address => uint256)) userContributions
```

_Mapping of pool index to the user's contribution._

### constructor

```solidity
constructor() public
```

Contract constructor - disabled due to upgradeability

### initialize

```solidity
function initialize(address owner_, address ybr_, address usdt_) public
```

_Initializes the contract._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner_ | address | The address of the owner. |
| ybr_ | address | The address of the YBR token. |
| usdt_ | address | The address of the USDT token. |

### getPoolCount

```solidity
function getPoolCount() external view returns (uint256)
```

_Returns the number of escrow pools._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The number of escrow pools. |

### createEscrowPool

```solidity
function createEscrowPool(uint256 contributionStart, uint256 contributionEnd, uint256 timeToMaturity, uint256 liquidityLimit, uint256 collateral, uint256 expectedYield) external
```

_Creates a new escrow pool. Requires a transfer of sufficient YBR tokens as collateral._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| contributionStart | uint256 | Pool contribution opening time. |
| contributionEnd | uint256 | Pool closing time. |
| timeToMaturity | uint256 | Pool time to maturity (when yield is distributed). |
| liquidityLimit | uint256 | Maximum USDT amount in the pool. |
| collateral | uint256 | The YBR collateral amount. |
| expectedYield | uint256 | Expected percentage yield after timeToMaturity with 2 decimal places. |

### contribute

```solidity
function contribute(uint256 poolIndex, uint256 amount) external
```

_Contributes to an escrow pool._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIndex | uint256 | The index of the pool. |
| amount | uint256 | The amount to contribute. |

### cancelPool

```solidity
function cancelPool(uint256 poolIndex) external
```

_Cancels a pool._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIndex | uint256 | The index of the pool. |

### withdrawPool

```solidity
function withdrawPool(uint256 poolIndex) external
```

_Withdraws the pool liquidity_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIndex | uint256 | The index of the pool. |

### repayPool

```solidity
function repayPool(uint256 poolIndex) external
```

_Repays the liquidity + yield_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIndex | uint256 | The index of the pool. |

### claim

```solidity
function claim(uint256 poolIndex) external
```

_Claims the contribution from an escrow pool._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIndex | uint256 | The index of the pool. |

### PoolCreation

```solidity
event PoolCreation(uint256 poolIndex)
```

_Emitted when creating a new escrow pool._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIndex | uint256 | The index of the pool. |

### Contribution

```solidity
event Contribution(uint256 poolIndex, address wallet, uint256 amount)
```

_Emitted when a contribution is made to an escrow pool._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIndex | uint256 | The index of the pool. |
| wallet | address | The address of the contributor. |
| amount | uint256 | The amount contributed. |

### PoolCancelation

```solidity
event PoolCancelation(uint256 poolIndex)
```

_Emitted when an escrow pool is cancelled._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIndex | uint256 | The index of the pool. |

### PoolWithdrawal

```solidity
event PoolWithdrawal(uint256 poolIndex)
```

_Emitted when liquidity is withdrawn from an escrow pool._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIndex | uint256 | The index of the pool. |

### PoolRepayment

```solidity
event PoolRepayment(uint256 poolIndex)
```

_Emitted when liquidity and yield are repaid to an escrow pool._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIndex | uint256 | The index of the pool. |

### Claim

```solidity
event Claim(uint256 poolIndex, address wallet, uint256 contribution, uint256 yield, uint256 collateral)
```

_Emitted when a claim is made from an escrow pool._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| poolIndex | uint256 | The index of the pool. |
| wallet | address | The address of the claimant. |
| contribution | uint256 | The amount of the contribution claimed. |
| yield | uint256 | The amount of yield claimed. |
| collateral | uint256 | The amount of collateral claimed. |

### InvalidPoolIndex

```solidity
error InvalidPoolIndex()
```

_Thrown when the provided pool index is invalid._

### ContributionNotOpen

```solidity
error ContributionNotOpen()
```

_Thrown when a contribution is attempted before the pool's contribution start time._

### ContributionClosed

```solidity
error ContributionClosed()
```

_Thrown when a contribution is attempted after the pool's contribution end time._

### ExceedsLiquidityLimit

```solidity
error ExceedsLiquidityLimit()
```

_Thrown when a contribution exceeds the pool's liquidity limit._

### PoolCancelled

```solidity
error PoolCancelled()
```

_Thrown when an action is attempted on a cancelled pool._

### TimeToMaturityReached

```solidity
error TimeToMaturityReached()
```

_Thrown when an action is attempted after the pool has reached its time to maturity._

### PoolNotClosed

```solidity
error PoolNotClosed()
```

_Thrown when an action is attempted on a pool that is not yet closed._

### PoolNotFull

```solidity
error PoolNotFull()
```

_Thrown when an action is attempted on a pool that is not yet full._

### NoContribution

```solidity
error NoContribution()
```

_Thrown when a user attempts to claim from a pool without any contribution._

### PoolClaimed

```solidity
error PoolClaimed()
```

_Thrown when an action is attempted on a pool that has already been claimed._

### NoClaim

```solidity
error NoClaim()
```

_Thrown when a user attempts to claim from a pool but there is nothing to claim._

