// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20CappedUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "./Compliance.sol";

import "hardhat/console.sol";

contract Token is
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    ERC20PausableUpgradeable,
    ERC20PermitUpgradeable,
    ERC20CappedUpgradeable
{
    mapping(address => bool) public frozen;
    mapping(address => uint) public lastUpdate;
    mapping(address => uint) public stakeValue;
    Compliance private _compliance;

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
        console.log("Token Initialized", _msgSender());
        _mint(saleManager_, cap_);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    // The following functions are overrides required by Solidity. - need to update with all the dependencies

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20Upgradeable, ERC20PausableUpgradeable, ERC20CappedUpgradeable) {
        require(!frozen[to] && !frozen[from], "Wallet frozen");
        _compliance.canTransfer(from, to, value);

        _updateStakeValue(from);
        _updateStakeValue(to);

        super._update(from, to, value);
    }

    function _updateStakeValue(address user) internal {
        // Instead of locking tokens, we are simply tracking any transfers and treating it like the tokens were staked during that time period.
        // User has 100 tokens, 1 month passes
        // User sends 50 tokens to someone else
        // We treat it as if the user staked 100 tokens for 1 month
        // And stakeValue[address] += 100 * 1 month or whatever (time since last update)
        // Now user has 50 tokens
        // Another 3 months pass
        // He sends the 50 tokens to someone else
        // We treat that as if he staked 50 tokens for 3 months
        // And stakeValue[address] += 50 * 3 months
        // We are going to keep account of how long people are holding tokens, and for how long. However, we want it to value the tokens more the longer they are held, up to a certain point
        uint256 timeSinceLastUpdate = block.timestamp - lastUpdate[user];
        stakeValue[user] += timeSinceLastUpdate * balanceOf(user);
        lastUpdate[user] = block.timestamp;
    }

    function forceTransfer(address from, address to, uint256 value) public onlyOwner {
        _update(from, to, value);
    }

    function freezeWallet(address wallet, bool isFrozen) public onlyOwner {
        frozen[wallet] = isFrozen;
    }

    error OwnableUnauthorizedAccount(address sender);

    // Inherit owner from compliance contract
    modifier onlyOwner() {
        if (_compliance.owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
        _;
    }
}
