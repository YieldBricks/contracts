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

    mapping(address user => TierData tier) public tiers;

    enum Tier {
        ROOKIE,
        EXPLORER,
        CAMPER,
        BUILDER,
        TYCOON,
        GURU
    }

    struct TierData {
        Tier tier;
        uint256 minBalance;
        uint256 expiration;
        bool hardcoded;
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

    function updateTier(address _account) public {
        // Check current tier for account, if tier already exists but isnt expired, throw TierAlreadyExists error
        // Else set tier to _getTierFromBalance for user balance

        TierData memory currentTier = tiers[_account];
        // TODO: clarify update logic
        // if (currentTier.tier != Tier.ROOKIE && currentTier.expiration > block.timestamp) {
        //     revert TierAlreadyExists();
        // }

        uint256 balance = _calculateLowestHistoricalBalance(_account, 30 days);

        TierData memory newTier = _getTierFromBalance(balance);
        tiers[_account] = newTier;
    }

    function adminSetTier(address[] calldata _accounts, Tier _tier) public onlyOwner {
        for (uint256 i = 0; i < _accounts.length; i++) {
            tiers[_accounts[i]] = TierData(_tier, 0, block.timestamp + 30 days, true);
        }
    }

    function _getTierFromBalance(uint256 balance) internal view returns (TierData memory) {
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

    function _calculateLowestHistoricalBalance(address user, uint256 period) internal view returns (uint256) {
        uint32 lastIndex = ybr.numCheckpoints(user);

        if (lastIndex == 0) {
            return 0;
        }
        lastIndex -= 1;
        Checkpoints.Checkpoint208 memory current = ybr.checkpoints(user, lastIndex);
        uint256 lowestBalance = current._value;
        uint48 targetTimestamp = uint48(block.timestamp - period);

        while (lastIndex > 0) {
            current = ybr.checkpoints(user, lastIndex);
            if (current._key < targetTimestamp) {
                break;
            }
            if (current._value < lowestBalance) {
                lowestBalance = current._value;
            }
            lastIndex -= 1;
        }

        return lowestBalance;
    }

    function getTierBenefits(address user) public view returns (TierBenefits memory) {
        TierData memory tier = tiers[user];
        if (tier.tier == Tier.ROOKIE) {
            return TierBenefits(tier.tier, 0, 500, 100);
        }

        if (!tier.hardcoded) {
            uint256 balance = ybr.getVotes(user);
            if (balance < tier.minBalance) {
                return TierBenefits(Tier.ROOKIE, 0, 500, 100);
            }
        }

        if (tier.expiration < block.timestamp) {
            revert TierExpired();
        }

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

    error TierAlreadyExists();
    error TierExpired();
    error YBRCheckpointsNotActivated();
}
