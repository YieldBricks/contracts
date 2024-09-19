---
layout: default
title: interfaces/ICustomToken
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

## ArbitrumEnabledToken

### isArbitrumEnabled

```solidity
function isArbitrumEnabled() external view returns (uint8)
```

should return `0xb1` if token is enabled for arbitrum gateways

_Previous implmentation used to return `uint8(0xa4b1)`, however that causes compile time error in Solidity 0.8. due to type mismatch.
     In current version `uint8(0xb1)` shall be returned, which results in no change as that's the same value as truncated `uint8(0xa4b1)`._

## ICustomToken

### registerTokenOnL2

```solidity
function registerTokenOnL2(address l2CustomTokenAddress, uint256 maxSubmissionCostForCustomBridge, uint256 maxSubmissionCostForRouter, uint256 maxGasForCustomBridge, uint256 maxGasForRouter, uint256 gasPriceBid, uint256 valueForGateway, uint256 valueForRouter, address creditBackAddress) external payable
```

Should make an external call to EthERC20Bridge.registerCustomL2Token

## L1MintableToken

### bridgeMint

```solidity
function bridgeMint(address account, uint256 amount) external
```

## L1ReverseToken

### bridgeBurn

```solidity
function bridgeBurn(address account, uint256 amount) external
```

