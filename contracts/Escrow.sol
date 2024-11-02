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
        if (poolIndex >= escrowPools.length) revert InvalidPoolIndex();
        EscrowPool memory escrowPool = escrowPools[poolIndex];

        if (block.timestamp < escrowPool.contributionStart) revert ContributionNotOpen();
        if (block.timestamp > escrowPool.contributionEnd) revert ContributionClosed();
        if (escrowPool.cancelled) revert PoolCancelled();
        if (poolContributions[poolIndex] + amount > escrowPool.liquidityLimit) revert ExceedsLiquidityLimit();

        poolContributions[poolIndex] += amount;
        userContributions[poolIndex][msg.sender] += amount;

        usdt.safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @dev Cancels a pool.
     * @param poolIndex The index of the pool.
     */
    function cancelPool(uint256 poolIndex) external onlyOwner {
        if (poolIndex >= escrowPools.length) revert InvalidPoolIndex();
        EscrowPool memory escrowPool = escrowPools[poolIndex];

        if (poolContributions[poolIndex] == 0) revert PoolClaimed();

        if (
            poolContributions[poolIndex] == escrowPool.liquidityLimit &&
            block.timestamp >= escrowPool.contributionEnd + escrowPool.timeToMaturity
        ) revert TimeToMaturityReached();

        escrowPools[poolIndex].cancelled = true;
    }

    /**
     * @dev Withdraws the pool liquidity
     * @param poolIndex The index of the pool.
     */
    function withdrawPool(uint256 poolIndex) external onlyOwner {
        if (poolIndex >= escrowPools.length) revert InvalidPoolIndex();
        EscrowPool memory escrowPool = escrowPools[poolIndex];

        if (escrowPool.cancelled) revert PoolCancelled();
        if (block.timestamp <= escrowPool.contributionEnd) revert PoolNotClosed();
        if (poolContributions[poolIndex] < escrowPool.liquidityLimit) revert PoolNotFull();

        uint256 contribution = poolContributions[poolIndex];
        poolContributions[poolIndex] = 0;
        usdt.safeTransfer(msg.sender, contribution);
    }

    /**
     * @dev Repays the liquidity + yield
     * @param poolIndex The index of the pool.
     */
    function repayPool(uint256 poolIndex) external onlyOwner {
        if (poolIndex >= escrowPools.length) revert InvalidPoolIndex();
        EscrowPool memory escrowPool = escrowPools[poolIndex];

        if (escrowPool.cancelled) revert PoolCancelled();
        if (block.timestamp <= escrowPool.contributionEnd) revert PoolNotClosed();

        usdt.safeTransfer(msg.sender, (escrowPool.liquidityLimit * escrowPool.expectedYield) / 10_000);
        ybr.safeTransfer(msg.sender, escrowPool.collateral);
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

        if (poolIndex >= escrowPools.length) revert InvalidPoolIndex();

        EscrowPool memory escrowPool = escrowPools[poolIndex];

        uint256 contribution = userContributions[poolIndex][msg.sender];
        if (contribution == 0) revert NoContribution();
        userContributions[poolIndex][msg.sender] = 0;

        uint256 yield = (contribution * escrowPool.expectedYield) / 10_000;

        if (escrowPool.cancelled) {
            // 1. The pool is cancelled
            usdt.safeTransfer(msg.sender, contribution);
        } else if (
            usdt.balanceOf(address(this)) < contribution + yield &&
            block.timestamp >= escrowPool.contributionEnd + escrowPool.timeToMaturity
        ) {
            // 2. The pool is defaulted
            uint256 collateral = (escrowPool.collateral * contribution) / escrowPool.liquidityLimit;
            ybr.safeTransfer(msg.sender, collateral);
        } else if (block.timestamp >= escrowPool.contributionEnd + escrowPool.timeToMaturity) {
            // 3. The pool is healthy and has reached maturity

            usdt.safeTransfer(msg.sender, contribution + yield);
        } else {
            revert NoClaim();
        }
    }

    // Custom errors
    error InvalidPoolIndex();
    error ContributionNotOpen();
    error ContributionClosed();
    error ExceedsLiquidityLimit();
    error PoolCancelled();
    error TimeToMaturityReached();
    error PoolNotClosed();
    error PoolNotFull();
    error NoContribution();
    error PoolClaimed();
    error NoClaim();
}
