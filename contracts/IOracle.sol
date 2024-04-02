// SPDX-License-Identifier: See LICENSE in root directory
pragma solidity ^0.8.20;

interface IOracle {
    function getYBRPrice() external view returns (uint256);
}
