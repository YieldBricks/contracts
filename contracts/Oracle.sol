// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.20;

import { Denominations } from "@chainlink/contracts/src/v0.8/Denominations.sol";
import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { OracleLibrary } from "@uniswap/v3-periphery/contracts/libraries/OracleLibrary.sol";
import { IUniswapV3Pool } from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";

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

/**
 * @title YieldbricksOracle Contract
 * @dev This contract is used to get the price of tokens using Chainlink feeds.
 */
contract YieldbricksOracle is IOracle, Ownable2StepUpgradeable {
    /**
     * @notice Mapping of ChainLink feeds for each token.
     */
    mapping(address token => DataFeed dataFeed) public dataFeeds;

    address constant YBR = 0x11920f139a3121c2836E01551D43F95B3c31159c;
    address constant USDT = 0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9;
    address constant YBR_USDT = 0xb18e2e8B2f6C4f3f2e5afc1229d9d7654B0DdAA3; //TODO, will upgrade once Uniswap pool is deployed
    uint256 constant MAX_PRICE_AGE = 5 days;

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
    ) external view override returns (uint256 price, uint256 priceDecimals, uint256 tokenDecimals) {
        // Temporarily fetch YBR price from Uniswap using best available TWAP
        if (tokenAddress == YBR) {
            uint32 secondsAgo = OracleLibrary.getOldestObservationSecondsAgo(YBR_USDT);
            (int24 arithmeticMeanTick, ) = OracleLibrary.consult(YBR_USDT, secondsAgo);
            uint256 ybrPrice = OracleLibrary.getQuoteAtTick(arithmeticMeanTick, 1e2 * 1e18, YBR, USDT);
            return (ybrPrice, 8, 18);
        }

        DataFeed memory dataFeed = dataFeeds[tokenAddress];
        (, int256 _price, , uint256 _updatedAt, ) = dataFeed.feed.latestRoundData();

        if (block.timestamp > _updatedAt + MAX_PRICE_AGE) {
            revert PriceDataTooOld(_updatedAt);
        }

        return (uint256(_price), dataFeed.priceDecimals, dataFeed.tokenDecimals);
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

    /**
     * @dev This error is thrown when a price feed is too old.
     */
    error PriceDataTooOld(uint256 priceTimestamp);
}
