// SPDX-License-Identifier: See LICENSE in root directory
pragma solidity ^0.8.20;

import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import { IOracle } from "../IOracle.sol";

contract MockOracle is IOracle {
    AggregatorV3Interface internal priceFeed;

    constructor(address _priceFeed) {
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    function getYBRPrice() public view returns (uint256) {
        return 15089401043;
    }
}
