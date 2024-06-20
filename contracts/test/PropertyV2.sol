// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.20;

/**
 * @title YieldBrick Platform PropertyV2 Token
 * @dev This contract implements an ERC20 token with additional features like burnability,
 * pausability, capping, and permit. It also includes a feature to freeze wallets.
 * @notice This contract is used for YieldBrick tokenized RWA properties.
 * @author Noah Jelich
 */
import { ERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {
    ERC20BurnableUpgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import {
    ERC20VotesUpgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import {
    ERC20PausableUpgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import {
    ERC20CappedUpgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20CappedUpgradeable.sol";
import {
    ERC20PermitUpgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { NoncesUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/NoncesUpgradeable.sol";
import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";

import { ComplianceV2 } from "./ComplianceV2.sol";

/**
 * @title YieldBricks PropertyV2 Contract
 * @notice This contract is for the YieldBricks property, which is a permissioned ERC20 token with additional features.
 * @dev This contract externally depends on the Compliance for the `canTransfer` function.
 */
contract PropertyV2 is
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    ERC20PausableUpgradeable,
    ERC20PermitUpgradeable,
    ERC20CappedUpgradeable,
    ERC20VotesUpgradeable
{
    /// @notice Mapping to track frozen wallets
    mapping(address wallet => bool isFrozen) public walletFrozen;
    /// @notice The Compliance contract responsible for KYC and AML checks
    ComplianceV2 private _compliance;

    /// @notice Mapping to track how many claims a user has made
    mapping(address user => uint256 nonce) public claimNonce;
    /// @notice Array of claims made by the ownerha
    Yield[] public claims;

    /**
     * @notice Struct to represent a yield claim
     */
    struct Yield {
        address rewardToken;
        uint256 amount;
        uint256 timestamp;
    }

    /// @notice Contract constructor - disabled due to upgradeability
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract by setting a `name`, a `symbol`, a `compliance`
     * contract address, a `saleManager` address,
     * and a `cap` on the total supply of tokens.
     * @param compliance The address of the Compliance contract
     * @param saleManager The address of the SaleManager contract
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param cap The cap on the total supply of tokens
     */
    function initialize(
        address compliance,
        address saleManager,
        string memory name,
        string memory symbol,
        uint256 cap
    ) external initializer {
        __ERC20_init(name, symbol);
        __ERC20Burnable_init();
        __ERC20Pausable_init();
        __ERC20Capped_init(cap);
        __ERC20Permit_init(name);
        _compliance = ComplianceV2(compliance);
        _mint(saleManager, cap);
    }

    /**
     * @dev Overrides for ERC20 inheritance chain, with added functionality for
     * freezing wallets and vote self-delegation
     * @param from The address to transfer from.
     * @param to The address to transfer to.
     * @param value The amount to be transferred.
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20Upgradeable, ERC20PausableUpgradeable, ERC20CappedUpgradeable, ERC20VotesUpgradeable) {
        if (walletFrozen[to]) {
            revert FrozenWalletError(to);
        }
        if (walletFrozen[from]) {
            revert FrozenWalletError(from);
        }
        _compliance.canTransfer(from, to);
        if (to != address(0) && _numCheckpoints(to) == 0 && delegates(to) == address(0)) {
            _delegate(to, to);
        }
        super._update(from, to, value);
    }

    /**
     * @notice Override the nonces function to return the nonce for a given owner
     * @param owner_ The address of the token holder
     */
    function nonces(address owner_) public view override(ERC20PermitUpgradeable, NoncesUpgradeable) returns (uint256) {
        return super.nonces(owner_);
    }

    /**
     * @notice Allows the owner to force a transfer of tokens from one address to the owner
     * @dev The closed nature of the system (only KYCed accounts can transfer) means that even if
     * a user leaks their private key, a malicious actor cannot send the tokens to an anonymous wallet,
     * so recovery conditions are very limited, and fully covered by our legal compliance model.
     * @param from The address to transfer from
     * @param value The amount to transfer
     */
    function forceTransfer(address from, uint256 value) public onlyOwner {
        _update(from, _msgSender(), value);
    }

    /**
     * @notice Controls contract pausing, preventing transfers
     */
    function pauseTransfers(bool isPaused) public onlyOwner {
        isPaused ? _pause() : _unpause();
        emit PauseTransfers(isPaused);
    }

    /**
     * @notice Allows the owner to add a claim to the contract
     * @param rewardToken The address of the reward token
     * @param amount The amount of the reward token
     * @param timestamp The timestamp of the claim
     */
    function addYield(address rewardToken, uint256 amount, uint256 timestamp) public onlyOwner {
        // Requires transfering the reward token to this contract in sufficient amount
        IERC20(rewardToken).transferFrom(_msgSender(), address(this), amount);
        claims.push(Yield(rewardToken, amount, timestamp));
        emit YieldAdded(claims.length - 1, rewardToken, amount);
    }

    /**
     * @notice Allows PropertyV2 token holders to collect their property yield
     * @dev This function is gas-optimized to allow for a large number of claims to be processed
     * in a single transaction. The owner can add claims to the contract, and then users can collect
     * their claims in batches of X at a time. The claim amount is proportional to the user's holdings
     * at the time of the claim.
     */
    function collectYields() external {
        uint256 lastClaimed = claimNonce[_msgSender()];
        uint256 topClaimToProcess = claims.length < lastClaimed + 10 ? claims.length : lastClaimed + 10;

        for (uint256 i = lastClaimed; i < topClaimToProcess; i++) {
            Yield storage claim = claims[i];

            // Calculate the claim amount
            uint256 holdings = getPastVotes(_msgSender(), claim.timestamp);
            uint256 totalSupply = getPastTotalSupply(claim.timestamp);
            uint256 claimAmount = (claim.amount * holdings) / totalSupply;

            // Transfer the claim amount to the user
            IERC20(claim.rewardToken).transfer(_msgSender(), claimAmount);
            emit YieldCollected(_msgSender(), claim.rewardToken, claimAmount);
        }

        // Update the nonce
        claimNonce[_msgSender()] = topClaimToProcess;
    }

    /**
     * @notice Allows the owner to freeze or unfreeze a wallet
     * @param wallet The address of the wallet to freeze or unfreeze
     * @param isFrozen A boolean indicating whether the wallet should be frozen or unfrozen
     */
    function freezeWallet(address wallet, bool isFrozen) public onlyOwner {
        walletFrozen[wallet] = isFrozen;
        emit WalletFrozen(wallet, isFrozen);
    }

    /**
     * @notice Throws if called by any account other than the owner.
     * @dev This modifier inherits the owner from the Compliance contract for central role management
     */
    modifier onlyOwner() {
        if (_compliance.owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
        _;
    }

    /**
     * @notice Passthrough the for owner() function from the Compliance contract, since the owner is inherited
     */
    function owner() public view returns (address) {
        return _compliance.owner();
    }

    /**
     * @notice Returns the current time as a uint48
     * @dev Override for ERC20Votes clock functionality
     */
    function clock() public view override returns (uint48) {
        return Time.timestamp();
    }

    /**
     * @notice Returns the EIP6372 clock mode
     * @dev Override for ERC20Votes clock functionality
     */
    function CLOCK_MODE() public view override returns (string memory) {
        if (clock() != Time.timestamp()) {
            revert ERC6372InconsistentClock();
        }
        return "mode=timestamp";
    }

    /**
     * @notice Error when a wallet is frozen
     * @param wallet The address of the wallet that was frozen
     */
    error FrozenWalletError(address wallet);
    error OwnableUnauthorizedAccount(address sender);

    /**
     * @dev Emitted when the frozen status of a wallet is changed.
     * @param wallet The address of the wallet.
     * @param isFrozen The new frozen status of the wallet.
     */
    event WalletFrozen(address wallet, bool isFrozen);

    /**
     * @dev Emitted when the pause status of transfers is changed.
     * @param isPaused The new pause status of transfers.
     */
    event PauseTransfers(bool isPaused);

    /**
     * @dev Emitted when yield is added.
     * @param transactionId The ID of the transaction.
     * @param rewardToken The address of the reward token.
     * @param amount The amount of yield added.
     */
    event YieldAdded(uint256 indexed transactionId, address rewardToken, uint256 amount);

    /**
     * @dev Emitted when yield is collected.
     * @param user The address of the user who collected the yield.
     * @param rewardToken The address of the reward token.
     * @param amount The amount of yield collected.
     */
    event YieldCollected(address indexed user, address rewardToken, uint256 amount);
}
