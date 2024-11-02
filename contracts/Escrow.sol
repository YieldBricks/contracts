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

        emit PoolCreation(escrowPools.length - 1);
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

        emit Contribution(poolIndex, msg.sender, amount);
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

        emit PoolCancelation(poolIndex);
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

        emit PoolWithdrawal(poolIndex);
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

        emit PoolRepayment(poolIndex);
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
            emit Claim(poolIndex, msg.sender, contribution, 0, 0);
        } else if (
            usdt.balanceOf(address(this)) < contribution + yield &&
            block.timestamp >= escrowPool.contributionEnd + escrowPool.timeToMaturity
        ) {
            // 2. The pool is defaulted
            uint256 collateral = (escrowPool.collateral * contribution) / escrowPool.liquidityLimit;
            ybr.safeTransfer(msg.sender, collateral);
            emit Claim(poolIndex, msg.sender, 0, 0, collateral);
        } else if (block.timestamp >= escrowPool.contributionEnd + escrowPool.timeToMaturity) {
            // 3. The pool is healthy and has reached maturity
            usdt.safeTransfer(msg.sender, contribution + yield);
            emit Claim(poolIndex, msg.sender, contribution, yield, 0);
        } else {
            revert NoClaim();
        }
    }

    /**
     * @dev Emitted when creating a new escrow pool.
     * @param poolIndex The index of the pool.
     */
    event PoolCreation(uint256 poolIndex);

    /**
     * @dev Emitted when a contribution is made to an escrow pool.
     * @param poolIndex The index of the pool.
     * @param wallet The address of the contributor.
     * @param amount The amount contributed.
     */
    event Contribution(uint256 poolIndex, address wallet, uint256 amount);

    /**
     * @dev Emitted when an escrow pool is cancelled.
     * @param poolIndex The index of the pool.
     */
    event PoolCancelation(uint256 poolIndex);

    /**
     * @dev Emitted when liquidity is withdrawn from an escrow pool.
     * @param poolIndex The index of the pool.
     */
    event PoolWithdrawal(uint256 poolIndex);

    /**
     * @dev Emitted when liquidity and yield are repaid to an escrow pool.
     * @param poolIndex The index of the pool.
     */
    event PoolRepayment(uint256 poolIndex);

    /**
     * @dev Emitted when a claim is made from an escrow pool.
     * @param poolIndex The index of the pool.
     * @param wallet The address of the claimant.
     * @param contribution The amount of the contribution claimed.
     * @param yield The amount of yield claimed.
     * @param collateral The amount of collateral claimed.
     */
    event Claim(uint256 poolIndex, address wallet, uint256 contribution, uint256 yield, uint256 collateral);

    /**
     * @dev Thrown when the provided pool index is invalid.
     */
    error InvalidPoolIndex();

    /**
     * @dev Thrown when a contribution is attempted before the pool's contribution start time.
     */
    error ContributionNotOpen();

    /**
     * @dev Thrown when a contribution is attempted after the pool's contribution end time.
     */
    error ContributionClosed();

    /**
     * @dev Thrown when a contribution exceeds the pool's liquidity limit.
     */
    error ExceedsLiquidityLimit();

    /**
     * @dev Thrown when an action is attempted on a cancelled pool.
     */
    error PoolCancelled();

    /**
     * @dev Thrown when an action is attempted after the pool has reached its time to maturity.
     */
    error TimeToMaturityReached();

    /**
     * @dev Thrown when an action is attempted on a pool that is not yet closed.
     */
    error PoolNotClosed();

    /**
     * @dev Thrown when an action is attempted on a pool that is not yet full.
     */
    error PoolNotFull();

    /**
     * @dev Thrown when a user attempts to claim from a pool without any contribution.
     */
    error NoContribution();

    /**
     * @dev Thrown when an action is attempted on a pool that has already been claimed.
     */
    error PoolClaimed();

    /**
     * @dev Thrown when a user attempts to claim from a pool but there is nothing to claim.
     */
    error NoClaim();
}
