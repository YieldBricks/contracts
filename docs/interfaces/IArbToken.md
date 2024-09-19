---
layout: default
title: interfaces/IArbToken
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

## IArbToken

### bridgeMint

```solidity
function bridgeMint(address account, uint256 amount) external
```

should increase token supply by amount, and should (probably) only be callable by the L1 bridge.

### bridgeBurn

```solidity
function bridgeBurn(address account, uint256 amount) external
```

should decrease token supply by amount, and should (probably) only be callable by the L1 bridge.

### l1Address

```solidity
function l1Address() external view returns (address)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | address of layer 1 token |

