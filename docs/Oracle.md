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

### getTokenUSDPrice

```solidity
function getTokenUSDPrice(address) external view returns (uint256 price, uint256 priceDecimals, uint256 tokenDecimals)
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

### getTokenUSDPrice

```solidity
function getTokenUSDPrice(address) external view returns (uint256 _price, uint256 priceDecimals, uint256 tokenDecimals)
```

## YieldbricksOracle

_This contract is used to get the price of tokens using Chainlink feeds._

### dataFeeds

```solidity
mapping(address => struct YieldbricksOracle.DataFeed) dataFeeds
```

Mapping of ChainLink feeds for each token.

### ybrPrice

```solidity
uint256 ybrPrice
```

### DataFeed

Struct to hold the ChainLink feed info and some metadata.

```solidity
struct DataFeed {
  contract AggregatorV3Interface feed;
  uint256 tokenDecimals;
  uint256 priceDecimals;
}
```

### initialize

```solidity
function initialize(address owner_) public
```

Initializer function for the upgradeable contract.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner_ | address | The address of the owner of the contract. |

### getTokenUSDPrice

```solidity
function getTokenUSDPrice(address tokenAddress) external view returns (uint256 price, uint256 priceDecimals, uint256 tokenDecimals)
```

_The feed returns the price of the token in USD with 8 decimals. We need to find out
how many tokens we can get for 1 USD, so we need to invert the price. However, there are
also token decimals - e.g. USDC has 6, while ETH has 18, so we need to account for those.
For example, if the price of GBP/USD is 1.27 (with 8 decimals), then to get how many GBP
tokens are needed, we run the following formula._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenAddress | address | The address of the token for which we want to get the price. |

### setYBRPrice

```solidity
function setYBRPrice(uint256 _price) external
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _price | uint256 | The price of 1 YBR in USD with 8 decimals. |

### setFeed

```solidity
function setFeed(address tokenAddress, address feedAddress, uint256 tokenDecimals, uint256 priceDecimals) external
```

_Sets the data feed for a specific token._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenAddress | address | The address of the token for which to set the data feed. |
| feedAddress | address | The address of the data feed contract. |
| tokenDecimals | uint256 | The number of decimals the token uses. |
| priceDecimals | uint256 | The number of decimals the price from the data feed uses. Emits a {FeedSet} event. |

### FeedSet

```solidity
event FeedSet(address token, address feed)
```

_Emitted when a data feed is set for a token._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The address of the token for which the data feed was set. |
| feed | address | The address of the data feed contract. |

