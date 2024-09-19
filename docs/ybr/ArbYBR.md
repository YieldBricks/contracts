---
layout: default
title: ybr/ArbYBR
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

## ArbYBR

This contract is for the YieldBricks token, which is an ERC20 token with additional features.

### initialize

```solidity
function initialize(address owner_, address _customGatewayAddress, address _l1TokenAddress) external
```

Initializes the contract

_This function replaces the constructor for upgradeable contracts._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner_ | address | The initial owner of the contract. |
| _customGatewayAddress | address |  |
| _l1TokenAddress | address |  |

### bridgeMint

```solidity
function bridgeMint(address account, uint256 amount) external
```

should increase token supply by amount, and should only be callable by the L2Gateway.

### bridgeBurn

```solidity
function bridgeBurn(address account, uint256 amount) external
```

should decrease token supply by amount, and should only be callable by the L2Gateway.

