// SPDX-License-Identifier: See LICENSE in root directory
pragma solidity ^0.8.20;

interface IOracle {
    function getYBRPrice() external view returns (uint256);
}

contract Oracle is IOracle {
    uint256 public price;

    function setPrice(uint256 _price) external {
        price = _price;
    }

    function getYBRPrice() external view override returns (uint256) {
        return price;
    }
}
