// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.20;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FjordYBR is ERC20 {
    constructor(address _owner) ERC20("Yieldbricks", "fYBR") {
        _mint(_owner, 30_000_000 * 10 ** decimals());
    }
}
