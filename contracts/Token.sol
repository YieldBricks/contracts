// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title YieldBrick Platform Property Token
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
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { NoncesUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/NoncesUpgradeable.sol";

import { Compliance } from "./Compliance.sol";

contract Token is
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    ERC20PausableUpgradeable,
    ERC20PermitUpgradeable,
    ERC20CappedUpgradeable,
    ERC20VotesUpgradeable
{
    /// @notice Mapping to track frozen wallets
    mapping(address => bool) public walletFrozen;
    /// @notice The Compliance contract responsible for KYC and AML checks
    Compliance private _compliance;

    /// @notice Contract constructor - disabled due to upgradeability
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract by setting a `name`, a `symbol`, a `compliance` contract address, a `saleManager` address,
     * and a `cap` on the total supply of tokens.
     * @param compliance_ The address of the Compliance contract
     * @param saleManager_ The address of the SaleManager contract
     * @param name_ The name of the token
     * @param symbol_ The symbol of the token
     * @param cap_ The cap on the total supply of tokens
     */
    function initialize(
        address compliance_,
        address saleManager_,
        string memory name_,
        string memory symbol_,
        uint256 cap_
    ) external initializer {
        __ERC20_init(name_, symbol_);
        __ERC20Burnable_init();
        __ERC20Pausable_init();
        __ERC20Capped_init(cap_);
        __ERC20Permit_init(name_);
        _compliance = Compliance(compliance_);
        _mint(saleManager_, cap_);
    }

    /**
     * @dev Overrides for ERC20 inheritance chain, with added functionality for freezing wallets and vote self-delegation
     * @param from The address to transfer from.
     * @param to The address to transfer to.
     * @param value The amount to be transferred.
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20Upgradeable, ERC20PausableUpgradeable, ERC20CappedUpgradeable, ERC20VotesUpgradeable) {
        require(!walletFrozen[to] && !walletFrozen[from], "Wallet frozen");
        _compliance.canTransfer(from, to, value);
        if (to != address(0) && _numCheckpoints(to) == 0 && delegates(to) == address(0)) {
            _delegate(to, to);
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
     * @notice Pauses the contract, preventing transfers
     */
    function pauseTransfers(bool isPaused) public onlyOwner {
        isPaused ? _pause() : _unpause();
    }

    /**
     * @notice Allows the owner to freeze or unfreeze a wallet
     * @param wallet The address of the wallet to freeze or unfreeze
     * @param isFrozen A boolean indicating whether the wallet should be frozen or unfrozen
     */
    function freezeWallet(address wallet, bool isFrozen) public onlyOwner {
        walletFrozen[wallet] = isFrozen;
    }

    error OwnableUnauthorizedAccount(address sender);

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
}
