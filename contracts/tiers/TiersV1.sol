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
    uint256 public constant DEFAULT_TIER_CALCULATION = 30 days;

    // The number of checkpoints that need to be processed before we switch to the fast calculation
    uint256 public constant FAST_AVERAGE_THRESHOLD = 30;

    ERC20Votes public ybr;

    // Tier overrides for specific accounts
    mapping(address => Tier) public tierOverrides;

    // The balance multiplier to use for the tier calculation, default is 100%
    uint256 public balanceMultiplier = 10_000;

    enum Tier {
        ROOKIE,
        EXPLORER,
        CAMPER,
        BUILDER,
        TYCOON,
        GURU
    }

    /**
     * @notice Struct to hold the benefits for a given tier.
     * @param tier The tier for which the benefits are to be retrieved.
     * @param earlyAccess The time for which the user has early access to the wallet.
     * @param tierAllocation The allocation of the wallet for the user.
     * @param walletLimit The limit of the wallet for the user.
     */
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

    /**
     * @notice Retrieve the tier of a user.
     * @param _account The account for which the tier is to be retrieved.
     */
    function getTier(address _account) public view returns (Tier) {
        return getHistoricalTier(_account, block.timestamp);
    }

    /**
     * @notice Retrieve the tier of a user at a given timestamp.
     * @param _account The account for which the tier is to be retrieved.
     * @param timestamp The timestamp at which the tier is to be retrieved.
     */
    function getHistoricalTier(address _account, uint256 timestamp) public view returns (Tier) {
        if (tierOverrides[_account] != Tier.ROOKIE) {
            return tierOverrides[_account];
        }
        uint256 balance = getAverageBalance(_account, timestamp);
        return _getTierFromBalance(balance);
    }

    /**
     * @notice Set the tier override for a given account.
     * @param _account The account for which the tier override is to be set.
     * @param _tier The tier to which the account is to be set.
     */
    function setTierOverride(address _account, Tier _tier) public onlyOwner {
        tierOverrides[_account] = _tier;

        emit TierOverrideSet(_account, _tier);
    }

    /**
     * @notice Calculate the average balance of a user over a given time period.
     * @param _account The user for which the average balance is to be calculated.
     * @param timestamp The timestamp at which the average balance is to be calculated.
     */
    function getAverageBalance(address _account, uint256 timestamp) public view returns (uint256) {
        return _calculateAverageHistoricalBalance(_account, timestamp - DEFAULT_TIER_CALCULATION, timestamp);
    }

    /**
     * @notice Set the balance multiplier.
     * @param _balanceMultiplier The new balance multiplier.
     */
    function setBalanceMultiplier(uint256 _balanceMultiplier) public onlyOwner {
        balanceMultiplier = _balanceMultiplier;
    }

    /**
     * @notice Calculate the tier of a user based on their average balance over a given time period.
     * @param balance The average balance of the user over the given time period.
     */
    function _getTierFromBalance(uint256 balance) internal view returns (Tier) {
        uint256 balanceScaled = (balance * 10000) / balanceMultiplier;

        if (balanceScaled >= TIER_GURU_THRESHOLD) {
            return Tier.GURU;
        } else if (balanceScaled >= TIER_TYCOON_THRESHOLD) {
            return Tier.TYCOON;
        } else if (balanceScaled >= TIER_BUILDER_THRESHOLD) {
            return Tier.BUILDER;
        } else if (balanceScaled >= TIER_CAMPER_THRESHOLD) {
            return Tier.CAMPER;
        } else if (balanceScaled >= TIER_EXPLORER_THRESHOLD) {
            return Tier.EXPLORER;
        }
        return Tier.ROOKIE;
    }

    /**
     * @notice Calculate the average balance of a user over a given time period.
     * @param user The user for which the average balance is to be calculated.
     * @param start The start time for the average balance calculation.
     * @param end The end time for the average balance calculation.
     */
    function _calculateAverageHistoricalBalance(
        address user,
        uint256 start,
        uint256 end
    ) internal view returns (uint256) {
        uint32 numCheckpoints = ybr.numCheckpoints(user);

        if (numCheckpoints == 0 || start >= end) {
            return 0;
        }

        if (numCheckpoints == 1) {
            Checkpoints.Checkpoint208 memory checkpoint = ybr.checkpoints(user, 0);
            if (checkpoint._key > end) {
                return 0;
            }
            return checkpoint._value;
        }

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

        uint32 startIndex = low > 0 ? low - 1 : 0;

        if (numCheckpoints - startIndex > FAST_AVERAGE_THRESHOLD) {
            return _fastCalcAverageHistoricalBalance(user, start, end);
        } else {
            return _slowCalcAverageHistoricalBalance(user, start, end, startIndex, numCheckpoints);
        }
    }

    /**
     * @notice Calculate the balance by looking at daily-ish checkpoints over the last month instead of processing all transactiions.
     * @dev This function is used to prevent DoSing of users by spamming them with lots of small transactions.
     * @param user The user for which the average balance is to be calculated.
     * @param start The start time for the average balance calculation.
     * @param end The end time for the average balance calculation.
     */
    function _fastCalcAverageHistoricalBalance(
        address user,
        uint256 start,
        uint256 end
    ) internal view returns (uint256) {
        // Instead of processing all transactions, we use ybr.getPastVotes to get balance at discrete timestamps and calculate the average balance

        uint256 balanceAverage = 0;

        // Split the time between start and end into 30 discrete timestamps
        uint256 timeStep = (end - start) / 30;

        for (uint256 i = 0; i < FAST_AVERAGE_THRESHOLD; i++) {
            uint256 time = start + i * timeStep;
            uint256 balance = ybr.getPastVotes(user, time);
            balanceAverage += balance;
        }

        return balanceAverage / FAST_AVERAGE_THRESHOLD;
    }

    /**
     * @notice Calculate the average balance by processing all transactions.
     * @dev This function is used when the number of transactions is small enough to be processed in a reasonable amount of time.
     * @param user The user for which the average balance is to be calculated.
     * @param start The start time for the average balance calculation.
     * @param end The end time for the average balance calculation.
     * @param startIndex The index of the checkpoint from which the calculation should start.
     * @param numCheckpoints The number of checkpoints for the user.
     */
    function _slowCalcAverageHistoricalBalance(
        address user,
        uint256 start,
        uint256 end,
        uint32 startIndex,
        uint32 numCheckpoints
    ) internal view returns (uint256) {
        uint32 index = startIndex;
        uint256 totalBalanceTime = 0;

        Checkpoints.Checkpoint208 memory current = ybr.checkpoints(user, index);

        uint256 realStart = current._key > start ? current._key : start;

        if (realStart > end) {
            return 0;
        }

        while (true) {
            // cheeck if there is a next checkpoint
            if (index + 1 == numCheckpoints) {
                // if there is no next checkpoint, add the remaining time until the end
                uint256 periodStart = current._key < start ? start : current._key;
                uint256 periodEnd = end;

                if (periodEnd > periodStart) {
                    uint256 timeHeld = periodEnd - periodStart;
                    totalBalanceTime += current._value * timeHeld;
                }

                break;
            } else {
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
        }

        uint256 totalTime = end - realStart;

        return totalBalanceTime / totalTime;
    }

    /**
     * @notice Retrieve the benefits for a given tier.
     * @param tier The tier for which the benefits are to be retrieved.
     */
    function getTierBenefits(Tier tier) public pure returns (TierBenefits memory) {
        if (tier == Tier.EXPLORER) {
            return TierBenefits(Tier.EXPLORER, 6 hours, 500, 200);
        } else if (tier == Tier.CAMPER) {
            return TierBenefits(Tier.CAMPER, 12 hours, 1000, 400);
        } else if (tier == Tier.BUILDER) {
            return TierBenefits(Tier.BUILDER, 24 hours, 1000, 600);
        } else if (tier == Tier.TYCOON) {
            return TierBenefits(Tier.TYCOON, 48 hours, 2000, 800);
        } else if (tier == Tier.GURU) {
            return TierBenefits(Tier.GURU, 72 hours, 3000, 1000);
        }
        return TierBenefits(Tier.ROOKIE, 0, 500, 100);
    }

    /**
     * @notice Event emitted when a tier override is set.
     * @param account The account for which the tier override is set.
     * @param tier The tier to which the account is set.
     */
    event TierOverrideSet(address indexed account, Tier tier);
}
