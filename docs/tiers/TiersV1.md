---
layout: default
title: tiers/TiersV1
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

## TiersV1

### TIER_ROOKIE_THRESHOLD

```solidity
uint256 TIER_ROOKIE_THRESHOLD
```

### TIER_EXPLORER_THRESHOLD

```solidity
uint256 TIER_EXPLORER_THRESHOLD
```

### TIER_CAMPER_THRESHOLD

```solidity
uint256 TIER_CAMPER_THRESHOLD
```

### TIER_BUILDER_THRESHOLD

```solidity
uint256 TIER_BUILDER_THRESHOLD
```

### TIER_TYCOON_THRESHOLD

```solidity
uint256 TIER_TYCOON_THRESHOLD
```

### TIER_GURU_THRESHOLD

```solidity
uint256 TIER_GURU_THRESHOLD
```

### TIER_ROOKIE_LOCKUP

```solidity
uint256 TIER_ROOKIE_LOCKUP
```

### TIER_EXPLORER_LOCKUP

```solidity
uint256 TIER_EXPLORER_LOCKUP
```

### TIER_CAMPER_LOCKUP

```solidity
uint256 TIER_CAMPER_LOCKUP
```

### TIER_BUILDER_LOCKUP

```solidity
uint256 TIER_BUILDER_LOCKUP
```

### TIER_TYCOON_LOCKUP

```solidity
uint256 TIER_TYCOON_LOCKUP
```

### TIER_GURU_LOCKUP

```solidity
uint256 TIER_GURU_LOCKUP
```

### DEFAULT_TIER_CALCULATION

```solidity
uint256 DEFAULT_TIER_CALCULATION
```

### FAST_AVERAGE_THRESHOLD

```solidity
uint256 FAST_AVERAGE_THRESHOLD
```

### ybr

```solidity
contract ERC20Votes ybr
```

### tierOverrides

```solidity
mapping(address => enum TiersV1.Tier) tierOverrides
```

### balanceMultiplier

```solidity
uint256 balanceMultiplier
```

### Tier

```solidity
enum Tier {
  ROOKIE,
  EXPLORER,
  CAMPER,
  BUILDER,
  TYCOON,
  GURU
}
```

### TierBenefits

Struct to hold the benefits for a given tier.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct TierBenefits {
  enum TiersV1.Tier tier;
  uint256 earlyAccess;
  uint256 tierAllocation;
  uint256 walletLimit;
}
```

### constructor

```solidity
constructor() public
```

Contract constructor - disabled due to upgradeability

### initialize

```solidity
function initialize(address owner_, address _ybr) public
```

Initializer function for the upgradeable contract.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner_ | address | The address of the owner of the contract. |
| _ybr | address |  |

### getTier

```solidity
function getTier(address _account) public view returns (enum TiersV1.Tier)
```

Retrieve the tier of a user.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _account | address | The account for which the tier is to be retrieved. |

### getHistoricalTier

```solidity
function getHistoricalTier(address _account, uint256 timestamp) public view returns (enum TiersV1.Tier)
```

Retrieve the tier of a user at a given timestamp.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _account | address | The account for which the tier is to be retrieved. |
| timestamp | uint256 | The timestamp at which the tier is to be retrieved. |

### setTierOverride

```solidity
function setTierOverride(address _account, enum TiersV1.Tier _tier) public
```

Set the tier override for a given account.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _account | address | The account for which the tier override is to be set. |
| _tier | enum TiersV1.Tier | The tier to which the account is to be set. |

### getAverageBalance

```solidity
function getAverageBalance(address _account, uint256 timestamp) public view returns (uint256)
```

Calculate the average balance of a user over a given time period.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _account | address | The user for which the average balance is to be calculated. |
| timestamp | uint256 | The timestamp at which the average balance is to be calculated. |

### setBalanceMultiplier

```solidity
function setBalanceMultiplier(uint256 _balanceMultiplier) public
```

Set the balance multiplier.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _balanceMultiplier | uint256 | The new balance multiplier. |

### _getTierFromBalance

```solidity
function _getTierFromBalance(uint256 balance) internal view returns (enum TiersV1.Tier)
```

Calculate the tier of a user based on their average balance over a given time period.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| balance | uint256 | The average balance of the user over the given time period. |

### _calculateAverageHistoricalBalance

```solidity
function _calculateAverageHistoricalBalance(address user, uint256 start, uint256 end) internal view returns (uint256)
```

Calculate the average balance of a user over a given time period.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user for which the average balance is to be calculated. |
| start | uint256 | The start time for the average balance calculation. |
| end | uint256 | The end time for the average balance calculation. |

### _fastCalcAverageHistoricalBalance

```solidity
function _fastCalcAverageHistoricalBalance(address user, uint256 start, uint256 end) internal view returns (uint256)
```

Calculate the balance by looking at daily-ish checkpoints over the last month instead of processing all transactiions.

_This function is used to prevent DoSing of users by spamming them with lots of small transactions._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user for which the average balance is to be calculated. |
| start | uint256 | The start time for the average balance calculation. |
| end | uint256 | The end time for the average balance calculation. |

### _slowCalcAverageHistoricalBalance

```solidity
function _slowCalcAverageHistoricalBalance(address user, uint256 start, uint256 end, uint32 startIndex, uint32 numCheckpoints) internal view returns (uint256)
```

Calculate the average balance by processing all transactions.

_This function is used when the number of transactions is small enough to be processed in a reasonable amount of time._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user for which the average balance is to be calculated. |
| start | uint256 | The start time for the average balance calculation. |
| end | uint256 | The end time for the average balance calculation. |
| startIndex | uint32 | The index of the checkpoint from which the calculation should start. |
| numCheckpoints | uint32 | The number of checkpoints for the user. |

### getTierBenefits

```solidity
function getTierBenefits(enum TiersV1.Tier tier) public pure returns (struct TiersV1.TierBenefits)
```

Retrieve the benefits for a given tier.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tier | enum TiersV1.Tier | The tier for which the benefits are to be retrieved. |

### TierOverrideSet

```solidity
event TierOverrideSet(address account, enum TiersV1.Tier tier)
```

Event emitted when a tier override is set.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The account for which the tier override is set. |
| tier | enum TiersV1.Tier | The tier to which the account is set. |

