---
layout: default
title: ybr/EthYBR
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

## EthYBR

This contract is for the YieldBricks token, which is an ERC20 token with additional features.

### constructor

```solidity
constructor() public
```

Contract constructor - disabled due to upgradeability

### initialize

```solidity
function initialize(address owner_, address _customGatewayAddress, address _routerAddress) external
```

Initializes the contract

_This function replaces the constructor for upgradeable contracts._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner_ | address | The initial owner of the contract. |
| _customGatewayAddress | address |  |
| _routerAddress | address |  |

