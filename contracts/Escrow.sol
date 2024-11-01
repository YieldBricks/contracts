// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.20;

import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import { BeaconProxy } from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import { UpgradeableBeacon } from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Property } from "./Property.sol";

/**
 * @title Escrow
 * @dev The Escrow contract allows users to contribute to escrow pools.
 */
contract Escrow is Ownable2StepUpgradeable, PausableUpgradeable {
    using SafeERC20 for IERC20;

    IERC20 public ybr;
    IERC20 public usdt;

    /**
     * @dev Struct representing an escrow pool.
     * @param contributionStart Pool contribution opening time.
     * @param contributionEnd Pool closing time.
     * @param timeToMaturity Pool time to maturity (when yield is distributed).
     * @param liquidityLimit Maximum USDT amount in the pool.
     * @param expectedYield Expected percentage yield after timeToMaturity. Represented as a percentage
     * with 2 decimal places, so 100 is 1%, and after timeToMaturity represents a 1 USDT gain on a 100 USDT contribution.
     * @param collateral The YBR collateral amount.
     */
    struct EscrowPool {
        uint256 contributionStart;
        uint256 contributionEnd;
        uint256 timeToMaturity;
        uint256 liquidityLimit;
        uint256 collateral;
        uint256 expectedYield;
        bool cancelled;
    }

    /**
     * @dev Escrow pool array.
     */
    EscrowPool[] public escrowPools;

    /**
     * @dev Mapping of pool index to the pool's total contribution.
     */
    mapping(uint256 poolIndex => uint256 totalContribution) public poolContributions;

    /**
     * @dev Mapping of pool index to the user's contribution.
     */
    mapping(uint256 poolIndex => mapping(address wallet => uint256 contribution)) public userContributions;

    /// @notice Contract constructor - disabled due to upgradeability
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract.
     * @param owner_ The address of the owner.
     * @param ybr_ The address of the YBR token.
     * @param usdt_ The address of the USDT token.
     */
    function initialize(address owner_, address ybr_, address usdt_) public initializer {
        __Ownable2Step_init();
        __Ownable_init(owner_);
        __Pausable_init();
        ybr = IERC20(ybr_);
        usdt = IERC20(usdt_);
    }

    /**
     * @dev Creates a new escrow pool. Requires a transfer of sufficient YBR tokens as collateral.
     * @param contributionStart Pool contribution opening time.
     * @param contributionEnd Pool closing time.
     * @param timeToMaturity Pool time to maturity (when yield is distributed).
     * @param liquidityLimit Maximum USDT amount in the pool.
     * @param collateral The YBR collateral amount.
     * @param expectedYield Expected percentage yield after timeToMaturity with 2 decimal places.
     */
    function createEscrowPool(
        uint256 contributionStart,
        uint256 contributionEnd,
        uint256 timeToMaturity,
        uint256 liquidityLimit,
        uint256 collateral,
        uint256 expectedYield
    ) external onlyOwner {
        EscrowPool memory escrowPool = EscrowPool({
            contributionStart: contributionStart,
            contributionEnd: contributionEnd,
            timeToMaturity: timeToMaturity,
            liquidityLimit: liquidityLimit,
            collateral: collateral,
            expectedYield: expectedYield,
            cancelled: false
        });

        ybr.safeTransferFrom(msg.sender, address(this), collateral);

        escrowPools.push(escrowPool);
    }

    /**
     * @dev Contributes to an escrow pool.
     * @param poolIndex The index of the pool.
     * @param amount The amount to contribute.
     */
    function contribute(uint256 poolIndex, uint256 amount) external whenNotPaused {
        require(poolIndex < escrowPools.length, "Invalid pool index");
        require(block.timestamp >= escrowPools[poolIndex].contributionStart, "Contribution not open");
        require(block.timestamp <= escrowPools[poolIndex].contributionEnd, "Contribution closed");
        require(
            poolContributions[poolIndex] + amount <= escrowPools[poolIndex].liquidityLimit,
            "Exceeds liquidity limit"
        );

        poolContributions[poolIndex] += amount;
        userContributions[poolIndex][msg.sender] += amount;

        usdt.safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @dev Cancels a pool.
     * @param poolIndex The index of the pool.
     */
    function cancelPool(uint256 poolIndex) external onlyOwner {
        require(poolIndex < escrowPools.length, "Invalid pool index");
        require(!escrowPools[poolIndex].cancelled, "Pool already cancelled");
        require(
            block.timestamp < escrowPools[poolIndex].contributionEnd + escrowPools[poolIndex].timeToMaturity,
            "Time to maturity reached"
        );
        escrowPools[poolIndex].cancelled = true;
    }

    /**
     * @dev Withdraws the pool liquidity
     * @param poolIndex The index of the pool.
     */
    function withdrawPool(uint256 poolIndex) external onlyOwner {
        require(poolIndex < escrowPools.length, "Invalid pool index");
        require(block.timestamp > escrowPools[poolIndex].contributionEnd, "Pool not closed");
        require(
            block.timestamp < escrowPools[poolIndex].contributionEnd + escrowPools[poolIndex].timeToMaturity,
            "Time to maturity reached"
        );
        require(poolContributions[poolIndex] == escrowPools[poolIndex].liquidityLimit, "Pool not full");

        uint256 contribution = escrowPools[poolIndex].liquidityLimit;
        usdt.safeTransfer(msg.sender, contribution);
    }

    /**
     * @dev Repays the liquidity + yield
     * @param poolIndex The index of the pool.
     */
    function repayPool(uint256 poolIndex) external onlyOwner {
        require(poolIndex < escrowPools.length, "Invalid pool index");
        require(block.timestamp > escrowPools[poolIndex].contributionEnd, "Pool not closed");

        uint256 contribution = escrowPools[poolIndex].liquidityLimit;
        uint256 yield = (contribution * escrowPools[poolIndex].expectedYield) / 10_000;

        usdt.safeTransfer(msg.sender, yield);
    }

    /**
     * @dev Claims the contribution from an escrow pool.
     * @param poolIndex The index of the pool.
     */
    function claim(uint256 poolIndex) external whenNotPaused {
        // There exist 3 different claim cases:
        // 1. The pool is cancelled - the user can claim their USDT back without yield.
        // 2. The pool is defaulted and has reached maturity, meaning there is insufficient USDT on this contract for a claim - the
        // user can claim the underlying YBR collateral instead of USDT.
        // 3. The pool is healthy and has reached maturity - the user can claim their USDT back with yield.

        require(poolIndex < escrowPools.length, "Invalid pool index");

        EscrowPool memory escrowPool = escrowPools[poolIndex];

        uint256 contribution = userContributions[poolIndex][msg.sender];
        require(contribution > 0, "No contribution");
        userContributions[poolIndex][msg.sender] = 0;
        poolContributions[poolIndex] -= contribution;

        uint256 yield = (contribution * escrowPool.expectedYield) / 10_000;

        if (escrowPool.cancelled) {
            // 1. The pool is cancelled
            usdt.safeTransfer(msg.sender, contribution);
        } else if (
            usdt.balanceOf(address(this)) < poolContributions[poolIndex] &&
            block.timestamp >= escrowPool.contributionEnd + escrowPool.timeToMaturity
        ) {
            // 2. The pool is defaulted
            ybr.safeTransfer(msg.sender, contribution);
        } else if (block.timestamp >= escrowPool.contributionEnd + escrowPool.timeToMaturity) {
            // 3. The pool is healthy and has reached maturity
            usdt.safeTransfer(msg.sender, contribution + yield);
        }
    }
}
