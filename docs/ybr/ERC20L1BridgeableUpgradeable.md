---
layout: default
title: ybr/ERC20L1BridgeableUpgradeable
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

## IL1CustomGateway

### registerTokenToL2

```solidity
function registerTokenToL2(address _l2Address, uint256 _maxGas, uint256 _gasPriceBid, uint256 _maxSubmissionCost, address _creditBackAddress) external payable returns (uint256)
```

## IL2GatewayRouter

### setGateway

```solidity
function setGateway(address _gateway, uint256 _maxGas, uint256 _gasPriceBid, uint256 _maxSubmissionCost, address _creditBackAddress) external payable returns (uint256)
```

## ERC20L1BridgeableUpgradeable

### __ERC20L1BridgeableUpgradeable_init

```solidity
function __ERC20L1BridgeableUpgradeable_init(address _customGatewayAddress, address _routerAddress) internal
```

### isArbitrumEnabled

```solidity
function isArbitrumEnabled() external view returns (uint8)
```

_we only set shouldRegisterGateway to true when in `registerTokenOnL2`_

### registerTokenOnL2

```solidity
function registerTokenOnL2(address l2CustomTokenAddress, uint256 maxSubmissionCostForCustomGateway, uint256 maxSubmissionCostForRouter, uint256 maxGasForCustomGateway, uint256 maxGasForRouter, uint256 gasPriceBid, uint256 valueForGateway, uint256 valueForRouter, address creditBackAddress) external payable
```

_See {ICustomToken-registerTokenOnL2}_

### NotRegisteringGateway

```solidity
error NotRegisteringGateway()
```

