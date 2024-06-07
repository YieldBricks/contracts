// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.20;

import { Denominations } from "@chainlink/contracts/src/v0.8/Denominations.sol";
import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

interface IOracle {
    function getTokensPerUSD(address) external view returns (uint256);
}

contract MockOracle is IOracle {
    uint256 public price;

    function setPrice(uint256 _price) external {
        price = _price;
    }

    function getTokensPerUSD(address tokenAddress) external view returns (uint256) {
        return price;
    }
}

contract ChainlinkOracle is IOracle, Ownable2StepUpgradeable {
    mapping(address token => AggregatorV3Interface dataFeed) public dataFeeds;

    function initialize(address owner_) public initializer {
        __Ownable2Step_init();
        __Ownable_init(owner_);
    }

    function getTokensPerUSD(address tokenAddress) external view override onlyOwner returns (uint256) {
        (, int256 price, , , ) = dataFeeds[tokenAddress].latestRoundData();
        return uint256(price);
    }

    function setFeed(address tokenAddress, address feedAddress) external onlyOwner {
        dataFeeds[tokenAddress] = AggregatorV3Interface(feedAddress);
        emit FeedSet(tokenAddress, feedAddress);
    }

    event FeedSet(address indexed token, address indexed feed);
}
