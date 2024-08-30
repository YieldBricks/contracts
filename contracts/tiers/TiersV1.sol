// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.20;

import { ERC20Votes } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";

import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

contract TiersV1 is Ownable2StepUpgradeable {
    uint256 public constant TIER_ROOKIE_THRESHOLD = 0;
    uint256 public constant TIER_EXPLORER_THRESHOLD = 1 ether;
    uint256 public constant TIER_CAMPER_THRESHOLD = 1000 ether;
    uint256 public constant TIER_BUILDER_THRESHOLD = 5000 ether;
    uint256 public constant TIER_TYCOON_THRESHOLD = 20000 ether;
    uint256 public constant TIER_GURU_THRESHOLD = 50000 ether;
    uint256 public constant TIER_ROOKIE_LOCKUP = 0;
    uint256 public constant TIER_EXPLORER_LOCKUP = 30 days;
    uint256 public constant TIER_CAMPER_LOCKUP = 30 days;
    uint256 public constant TIER_BUILDER_LOCKUP = 90 days;
    uint256 public constant TIER_TYCOON_LOCKUP = 90 days;
    uint256 public constant TIER_GURU_LOCKUP = 180 days;
    uint256 public constant DEFAULT_TIER_EXPIRATION = 30 days;
    uint256 public constant AVERAGE_BLOCK_TIME = 13 seconds;

    ERC20Votes public ybr;

    mapping(address => Tier) public tierOverrides;

    enum Tier {
        ROOKIE,
        EXPLORER,
        CAMPER,
        BUILDER,
        TYCOON,
        GURU
    }

    struct TierBenefits {
        Tier tier;
        uint256 earlyAccess;
        uint256 tierAllocation;
        uint256 walletLimit;
    }

    /**
     * @notice Initializer function for the upgradeable contract.
     * @param owner_ The address of the owner of the contract.
     */
    function initialize(address owner_, address _ybr) public initializer {
        __Ownable2Step_init();
        __Ownable_init(owner_);
        ybr = ERC20Votes(_ybr);
    }

    function getTier(address _account) public view returns (Tier) {
        return getHistoricalTier(_account, block.timestamp);
    }

    function getHistoricalTier(address _account, uint256 timestamp) public view returns (Tier) {
        uint256 balance = _calculateAverageHistoricalBalance(_account, timestamp - 30 days, timestamp);
        return _getTierFromBalance(balance);
    }

    function _getTierFromBalance(uint256 balance) internal view returns (Tier) {
        if (balance == 0) {
            return TierData(Tier.ROOKIE, 0, 0, false);
        }
        if (balance >= TIER_GURU_THRESHOLD) {
            return TierData(Tier.GURU, TIER_GURU_THRESHOLD, block.timestamp + DEFAULT_TIER_EXPIRATION, false);
        } else if (balance >= TIER_TYCOON_THRESHOLD) {
            return TierData(Tier.TYCOON, TIER_TYCOON_THRESHOLD, block.timestamp + DEFAULT_TIER_EXPIRATION, false);
        } else if (balance >= TIER_BUILDER_THRESHOLD) {
            return TierData(Tier.BUILDER, TIER_BUILDER_THRESHOLD, block.timestamp + DEFAULT_TIER_EXPIRATION, false);
        } else if (balance >= TIER_CAMPER_THRESHOLD) {
            return TierData(Tier.CAMPER, TIER_CAMPER_THRESHOLD, block.timestamp + DEFAULT_TIER_EXPIRATION, false);
        } else if (balance >= TIER_EXPLORER_THRESHOLD) {
            return TierData(Tier.EXPLORER, TIER_EXPLORER_THRESHOLD, block.timestamp + DEFAULT_TIER_EXPIRATION, false);
        }
        return TierData(Tier.ROOKIE, 0, 0, false);
    }

    function _calculateAverageHistoricalBalance(
        address user,
        uint256 start,
        uint256 end
    ) internal view returns (uint256) {
        uint32 numCheckpoints = ybr.numCheckpoints(user);

        if (numCheckpoints == 0 || start >= end) {
            return 0;
        }

        uint256 totalBalanceTime = 0;
        uint256 totalTime = end - start;

        uint32 low = 0;
        uint32 high = numCheckpoints;

        while (low < high) {
            uint32 mid = low + (high - low) / 2;
            Checkpoints.Checkpoint208 memory midCheckpoint = ybr.checkpoints(user, mid);

            if (midCheckpoint._key <= start) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }

        uint32 index = low > 0 ? low - 1 : 0;
        Checkpoints.Checkpoint208 memory current = ybr.checkpoints(user, index);

        while (index < numCheckpoints) {
            Checkpoints.Checkpoint208 memory next = ybr.checkpoints(user, index + 1);

            uint256 periodStart = current._key < start ? start : current._key;
            uint256 periodEnd = next._key > end ? end : next._key;

            if (periodEnd > periodStart) {
                uint256 timeHeld = periodEnd - periodStart;
                totalBalanceTime += current._value * timeHeld;
            }

            if (next._key > end) {
                break;
            }

            current = next;
            index += 1;
        }

        return totalBalanceTime / totalTime;
    }

    function getTierBenefits(Tier tier) public view returns (TierBenefits memory) {
        if (tier.tier == Tier.EXPLORER) {
            return TierBenefits(tier.tier, 6 hours, 500, 200);
        } else if (tier.tier == Tier.CAMPER) {
            return TierBenefits(tier.tier, 12 hours, 1000, 400);
        } else if (tier.tier == Tier.BUILDER) {
            return TierBenefits(tier.tier, 24 hours, 1000, 600);
        } else if (tier.tier == Tier.TYCOON) {
            return TierBenefits(tier.tier, 48 hours, 2000, 800);
        } else if (tier.tier == Tier.GURU) {
            return TierBenefits(tier.tier, 72 hours, 3000, 1000);
        }
        return TierBenefits(Tier.ROOKIE, 0, 500, 100);
    }
}
