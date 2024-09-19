---
layout: default
title: ybr/ERC20L2BridgeableUpgradeable
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

## ERC20L2BridgeableUpgradeable

### l2Gateway

```solidity
address l2Gateway
```

### l1Address

```solidity
address l1Address
```

### onlyL2Gateway

```solidity
modifier onlyL2Gateway()
```

### __ERC20L2BridgeableUpgradeable_init

```solidity
function __ERC20L2BridgeableUpgradeable_init(address _l2Gateway, address _l1TokenAddress) internal
```

### bridgeMint

```solidity
function bridgeMint(address account, uint256 amount) external virtual
```

should increase token supply by amount, and should only be callable by the L2Gateway.

### bridgeBurn

```solidity
function bridgeBurn(address account, uint256 amount) external virtual
```

should decrease token supply by amount, and should only be callable by the L2Gateway.

### NotGateway

```solidity
error NotGateway(address sender)
```

