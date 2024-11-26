// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

contract AxelarBridgeableUpgradeable {
    address public constant AXELAR_ROLE = 0xe05f286D397a8D1fB89f421944E36E55F7B8e968;

    modifier onlyAxelar() {
        if (msg.sender != AXELAR_ROLE) {
            revert NotAxelar(msg.sender);
        }
        _;
    }

    /**
     * @notice should increase token supply by amount, and should only be callable by Axelar.
     */
    function mint(address account, uint256 amount) external virtual onlyAxelar {}

    /**
     * @notice should decrease token supply by amount, and should only be callable by Axelar.
     */
    function burn(address account, uint256 amount) external virtual onlyAxelar {}

    error NotAxelar(address sender);
}
