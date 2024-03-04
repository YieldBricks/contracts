// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "./Compliance.sol";

contract Token is ERC20, ERC20Burnable, ERC20Pausable, ERC20Permit, ERC20Capped {
    mapping(address => bool) private _frozen;
    Compliance private _compliance;

    constructor(
        address compliance_,
        string memory name_,
        string memory symbol_,
        uint256 cap_
    ) ERC20(name_, symbol_) ERC20Permit(name_) ERC20Capped(cap_) {
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

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Pausable, ERC20Capped) {
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
