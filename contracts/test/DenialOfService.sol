// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./../SaleManager.sol";
import "./../Property.sol";

contract DenialOfService {
    bool called;

    receive() external payable {
        if (!called) {
            called = true;
            revert("DoS");
        }
    }

    function buyTokens(address saleManager, address token, uint256 amount) external payable {
        SaleManager(saleManager).buyTokens{ value: msg.value }(amount, token);
    }

    function claimTokens(address saleManager, address token) external {
        SaleManager(saleManager).claimTokens(token);
    }

    function cancelPurchase(address saleManager, address token) external {
        SaleManager(saleManager).cancelPurchase(token);
    }
}
