// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.20;

import { Denominations } from "@chainlink/contracts/src/v0.8/Denominations.sol";
import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

interface IOracle {
    function getTokenUSDPrice(
        address
    ) external view returns (uint256 price, uint256 priceDecimals, uint256 tokenDecimals);
}

contract MockOracle is IOracle {
    uint256 public price;

    function setPrice(uint256 _price) external {
        price = _price;
    }

    function getTokenUSDPrice(
        address // tokenAddress
    ) external view returns (uint256 _price, uint256 priceDecimals, uint256 tokenDecimals) {
        return (price, 1, 18);
    }
}

contract ChainlinkOracle is IOracle, Ownable2StepUpgradeable {
    /**
     * @notice Mapping of ChainLink feeds for each token.
     */
    mapping(address token => DataFeed dataFeed) public dataFeeds;

    /**
     * @notice Struct to hold the ChainLink feed info and some metadata.
     */
    struct DataFeed {
        AggregatorV3Interface feed;
        uint256 tokenDecimals;
        uint256 priceDecimals;
    }

    /**
     * @notice Initializer function for the upgradeable contract.
     * @param owner_ The address of the owner of the contract.
     */
    function initialize(address owner_) public initializer {
        __Ownable2Step_init();
        __Ownable_init(owner_);
    }

    /**
     * @dev The feed returns the price of the token in USD with 8 decimals. We need to find out
     * how many tokens we can get for 1 USD, so we need to invert the price. However, there are
     * also token decimals - e.g. USDC has 6, while ETH has 18, so we need to account for those.
     * For example, if the price of GBP/USD is 1.27 (with 8 decimals), then to get how many GBP
     * tokens are needed, we run the following formula.
     * @param tokenAddress The address of the token for which we want to get the price.
     */
    function getTokenUSDPrice(
        address tokenAddress
    ) external view override onlyOwner returns (uint256 price, uint256 priceDecimals, uint256 tokenDecimals) {
        DataFeed memory dataFeed = dataFeeds[tokenAddress];
        (, int256 price, , , ) = dataFeeds[tokenAddress].feed.latestRoundData();

        return (uint256(price), dataFeed.priceDecimals, dataFeed.tokenDecimals);
    }

    /**
     * @dev Sets the data feed for a specific token.
     * @param tokenAddress The address of the token for which to set the data feed.
     * @param feedAddress The address of the data feed contract.
     * @param tokenDecimals The number of decimals the token uses.
     * @param priceDecimals The number of decimals the price from the data feed uses.
     *
     * Emits a {FeedSet} event.
     */
    function setFeed(
        address tokenAddress,
        address feedAddress,
        uint256 tokenDecimals,
        uint256 priceDecimals
    ) external onlyOwner {
        dataFeeds[tokenAddress] = DataFeed({
            feed: AggregatorV3Interface(feedAddress),
            tokenDecimals: tokenDecimals,
            priceDecimals: priceDecimals
        });
        emit FeedSet(tokenAddress, feedAddress);
    }

    /**
     * @dev Emitted when a data feed is set for a token.
     * @param token The address of the token for which the data feed was set.
     * @param feed The address of the data feed contract.
     */
    event FeedSet(address indexed token, address indexed feed);
}
