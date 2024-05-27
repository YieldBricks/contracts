// SPDX-License-Identifier: See LICENSE in root directory
pragma solidity ^0.8.20;

/**
 * @title YieldBricks (YBR) Token
 * @dev This contract implements an ERC20 token with additional features like burnability,
 * pausability, capping, voting, and permit. It also includes a feature to freeze wallets.
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
import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { NoncesUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/NoncesUpgradeable.sol";
import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";

/**
 * @title YieldBricks (YBR) Token Contract
 * @notice This contract is for the YieldBricks token, which is an ERC20 token with additional features.
 */
contract YBR is
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    ERC20PausableUpgradeable,
    ERC20PermitUpgradeable,
    ERC20CappedUpgradeable,
    ERC20VotesUpgradeable,
    Ownable2StepUpgradeable
{
    /// @notice Mapping to track frozen wallets
    mapping(address wallet => bool isFrozen) public walletFrozen;
    uint private constant _CAP = 1_000_000_000 ether;

    /// @notice Contract constructor - disabled due to upgradeability
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract
     * @dev This function replaces the constructor for upgradeable contracts.
     * @param owner_ The initial owner of the contract.
     */
    function initialize(address owner_) external initializer {
        __ERC20_init("YieldBricks", "YBR");
        __ERC20Burnable_init();
        __ERC20Pausable_init();
        __ERC20Capped_init(_CAP);
        __ERC20Permit_init("YieldBricks");
        __ERC20Votes_init();
        __Ownable2Step_init();
        __Ownable_init(owner_);

        _mint(owner_, _CAP);
    }

    /**
     * @notice Overrides the ERC20 _beforeTokenTransfer function to add wallet freezing functionality
     * as well incorporate the other inherited functions.
     * @param from The address from which the tokens are being transferred
     * @param to The address to which the tokens are being transferred
     * @param value The amount of tokens being transferred
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

        super._update(from, to, value);
    }

    /**
     * @notice Override the nonces function to return the nonce for a given owner
     * @param owner The address of the token holder
     */
    function nonces(address owner) public view override(ERC20PermitUpgradeable, NoncesUpgradeable) returns (uint256) {
        return super.nonces(owner);
    }

    /**
     * @notice Pauses the contract, preventing transfers
     */
    function pauseTransfers(bool isPaused) public onlyOwner {
        isPaused ? _pause() : _unpause();
        emit PauseTransfers(isPaused);
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
     * @param wallet The address of the wallet that is frozen
     */
    error FrozenWalletError(address wallet);

    // Events
    event WalletFrozen(address wallet, bool isFrozen);
    event PauseTransfers(bool isPaused);
}
