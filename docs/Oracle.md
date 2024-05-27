<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Solidity API](#solidity-api)
  - [IOracle](#ioracle)
    - [getTokensPerUSD](#gettokensperusd)
  - [MockOracle](#mockoracle)
    - [price](#price)
    - [setPrice](#setprice)
    - [getTokensPerUSD](#gettokensperusd-1)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Solidity API

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

