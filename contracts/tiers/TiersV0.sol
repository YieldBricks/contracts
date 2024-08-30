// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.20;

import { ERC20Votes } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";

import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

contract TiersV0 is Ownable2StepUpgradeable {
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

    function adminSetTier(address[] calldata _accounts, Tier _tier) public onlyOwner {
        for (uint256 i = 0; i < _accounts.length; i++) {
            tiers[_accounts[i]] = TierData(_tier, 0, block.timestamp + 30 days, true);
        }
    }

    function getTierBenefits(address user) public view returns (TierBenefits memory) {
        return TierBenefits(Tier.ROOKIE, 0, 500, 100);
    }

    error TierAlreadyExists();
    error TierExpired();
    error YBRCheckpointsNotActivated();
}
