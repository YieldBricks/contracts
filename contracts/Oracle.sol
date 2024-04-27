// SPDX-License-Identifier: See LICENSE in root directory
pragma solidity ^0.8.20;

import { FeedRegistryInterface } from "@chainlink/contracts/src/v0.8/interfaces/FeedRegistryInterface.sol";
import { Denominations } from "@chainlink/contracts/src/v0.8/Denominations.sol";

interface IOracle {
    function getUSDPrice(address) external view returns (uint256);
}

contract MockOracle is IOracle {
    uint256 public price;

    function setPrice(uint256 _price) external {
        price = _price;
    }

    function getUSDPrice(address tokenAddress) external view returns (uint256) {
        return price;
    }
}
