// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract ERC20L2BridgeableUpgradeable is Initializable {
    address public l2Gateway;
    address public l1Address;

    modifier onlyL2Gateway() {
        if (msg.sender != l2Gateway) {
            revert NotGateway(msg.sender);
        }
        _;
    }

    function __ERC20L2BridgeableUpgradeable_init(address _l2Gateway, address _l1TokenAddress) internal initializer {
        l2Gateway = _l2Gateway;
        l1Address = _l1TokenAddress;
    }

    /**
     * @notice should increase token supply by amount, and should only be callable by the L2Gateway.
     */
    function bridgeMint(address account, uint256 amount) external virtual onlyL2Gateway {}

    /**
     * @notice should decrease token supply by amount, and should only be callable by the L2Gateway.
     */
    function bridgeBurn(address account, uint256 amount) external virtual onlyL2Gateway {}

    error NotGateway(address sender);
}
