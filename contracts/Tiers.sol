// SPDX-License-Identifier: See LICENSE in root directory
pragma solidity ^0.8.20;

// import { Oracle } from "./Oracle.sol";
import { ERC20Votes } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";

import "hardhat/console.sol";

abstract contract Tiers {
    // uint256 public constant TIER_ROOKIE_THRESHOLD = 0;
    // uint256 public constant TIER_EXPLORER_THRESHOLD = 1;
    // uint256 public constant TIER_CAMPER_THRESHOLD = 1000;
    // uint256 public constant TIER_BUILDER_THRESHOLD = 5000;
    // uint256 public constant TIER_TYCOON_THRESHOLD = 20000;
    // uint256 public constant TIER_GURU_THRESHOLD = 50000;
    // uint256 public constant TIER_ROOKIE_LOCKUP = 0;
    // uint256 public constant TIER_EXPLORER_LOCKUP = 30 days;
    // uint256 public constant TIER_CAMPER_LOCKUP = 30 days;
    // uint256 public constant TIER_BUILDER_LOCKUP = 90 days;
    // uint256 public constant TIER_TYCOON_LOCKUP = 90 days;
    // uint256 public constant TIER_GURU_LOCKUP = 180 days;
    // uint256 public constant DEFAULT_TIER_EXPIRATION = 30 days;
    // uint256 public constant AVERAGE_BLOCK_TIME = 13 seconds;
    // Oracle public oracle;
    // ERC20Votes public token;
    // mapping(address user => TierData tier) public tiers;
    // enum Tier {
    //     ROOKIE,
    //     EXPLORER,
    //     CAMPER,
    //     BUILDER,
    //     TYCOON,
    //     GURU
    // }
    // struct TierData {
    //     uint256 expiration;
    //     uint256 updatedAt;
    //     Tier tier;
    // }
    // constructor(address _oracleAddress, address _tokenAddress) {
    //     oracle = Oracle(_oracleAddress);
    //     token = ERC20Votes(_tokenAddress);
    // }
    // function updateTier(address _account, Tier tier) public {
    //     // We need to check if the user has enough tokens to be in a tier, over the last month
    //     // If the user has enough tokens, we need to update the tier, we do that by checking ERC20Votes checkpoints.abi
    //     uint32 numCheckpoints = token.numCheckpoints(_account);
    //     Checkpoints.Checkpoint208 memory earliestCheckpoint = token.checkpoints(_account, numCheckpoints - 1);
    //     uint256 earliestCheckpoint;
    //     uint256 minimumBalance;
    //     if (tier == Tier.GURU) {
    //         earliestBlock = block.number - (block.timestamp - TIER_GURU_LOCKUP) / AVERAGE_BLOCK_TIME;
    //         minimumBalance = TIER_GURU_THRESHOLD;
    //     } else if (tier == Tier.TYCOON) {
    //         earliestBlock = block.number - (block.timestamp - TIER_TYCOON_LOCKUP) / AVERAGE_BLOCK_TIME;
    //         minimumBalance = TIER_TYCOON_THRESHOLD;
    //     } else if (tier == Tier.BUILDER) {
    //         earliestBlock = block.number - (block.timestamp - TIER_BUILDER_LOCKUP) / AVERAGE_BLOCK_TIME;
    //         minimumBalance = TIER_BUILDER_THRESHOLD;
    //     } else if (tier == Tier.CAMPER) {
    //         earliestBlock = block.number - (block.timestamp - TIER_CAMPER_LOCKUP) / AVERAGE_BLOCK_TIME;
    //         minimumBalance = TIER_CAMPER_THRESHOLD;
    //     } else if (tier == Tier.EXPLORER) {
    //         earliestBlock = block.number - (block.timestamp - TIER_EXPLORER_LOCKUP) / AVERAGE_BLOCK_TIME;
    //         minimumBalance = TIER_EXPLORER_THRESHOLD;
    //     }
    //     // Now we need to find the
    // }
    // function getTier(address _account) public view returns (Tier, uint256) {
    //     // check if tier is expired, if not expired, return tier, else return ROOKIE
    //     TierData memory tier = tiers[_account];
    //     if (tier.expiration > block.timestamp) {
    //         return (tier.tier, tier.updatedAt);
    //     } else {
    //         return (Tier.ROOKIE, 0);
    //     }
    // }
}
