// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20CappedUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "./Compliance.sol";

contract Token is
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    ERC20PausableUpgradeable,
    ERC20PermitUpgradeable,
    ERC20CappedUpgradeable
{
    mapping(address => bool) private _frozen;
    Compliance private _compliance;

    function initialize(
        address compliance_,
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
        _mint(_msgSender(), cap_);
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
        require(!_frozen[to] && !_frozen[from], "Wallet frozen");
        require(_compliance.canTransfer(from, to, value), "Compliance failure");

        super._update(from, to, value);
    }

    function forceTransfer(address from, address to, uint256 value) public onlyOwner {
        _update(from, to, value);
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
