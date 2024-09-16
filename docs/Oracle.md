---
layout: default
title: Oracle
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

## IOracle

### getTokensPerUSD

```solidity
function getTokensPerUSD(address) external view returns (uint256)
```

## MockOracle

### price

```solidity
uint256 price
```

### setPrice

```solidity
function setPrice(uint256 _price) external
```

### getTokensPerUSD

```solidity
function getTokensPerUSD(address tokenAddress) external view returns (uint256)
```

## YieldbricksOracle

### dataFeeds

```solidity
mapping(address => contract AggregatorV3Interface) dataFeeds
```

### initialize

```solidity
function initialize(address owner_) public
```

### getTokensPerUSD

```solidity
function getTokensPerUSD(address tokenAddress) external view returns (uint256)
```

### setFeed

```solidity
function setFeed(address tokenAddress, address feedAddress) external
```

### FeedSet

```solidity
event FeedSet(address token, address feed)
```
