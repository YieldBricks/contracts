// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

contract AxelarBridgeableUpgradeable {
    address public axelarMinter;

    modifier onlyAxelar() {
        if (msg.sender != axelarMinter) {
            revert NotAxelar(msg.sender);
        }
        _;
    }

    /**
     * @notice should increase token supply by amount, and should only be callable by Axelar.
     */
    function axelarMint(address account, uint256 amount) external virtual onlyAxelar {}

    /**
     * @notice should decrease token supply by amount, and should only be callable by Axelar.
     */
    function axelarBurn(address account, uint256 amount) external virtual onlyAxelar {}

    error NotAxelar(address sender);
}
