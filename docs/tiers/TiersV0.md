---
layout: default
title: tiers/TiersV0
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

## TiersV0

### ybr

```solidity
contract ERC20Votes ybr
```

### tiers

```solidity
mapping(address => struct TiersV0.TierData) tiers
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

### TierData

```solidity
struct TierData {
  enum TiersV0.Tier tier;
  uint256 minBalance;
  uint256 expiration;
  bool hardcoded;
}
```

### TierBenefits

```solidity
struct TierBenefits {
  enum TiersV0.Tier tier;
  uint256 earlyAccess;
  uint256 tierAllocation;
  uint256 walletLimit;
}
```

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

### adminSetTier

```solidity
function adminSetTier(address[] _accounts, enum TiersV0.Tier _tier) public
```

### getTierBenefits

```solidity
function getTierBenefits(address user) public view returns (struct TiersV0.TierBenefits)
```

### TierAlreadyExists

```solidity
error TierAlreadyExists()
```

### TierExpired

```solidity
error TierExpired()
```

### YBRCheckpointsNotActivated

```solidity
error YBRCheckpointsNotActivated()
```

