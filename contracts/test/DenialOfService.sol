// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./../SaleManager.sol";
import "./../Token.sol";

contract DenialOfService {
    receive() external payable {
        revert("DoS");
    }

    function claimTokens(address saleManager, address token) external {
        SaleManager(saleManager).claimTokens(Token(token));
    }

    function cancelPurchase(address saleManager, address token) external {
        SaleManager(saleManager).cancelPurchase(Token(token));
    }
}
