// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title Interface needed to call function registerTokenToL2 of the L1CustomGateway
 */
interface IL1CustomGateway {
    function registerTokenToL2(
        address _l2Address,
        uint256 _maxGas,
        uint256 _gasPriceBid,
        uint256 _maxSubmissionCost,
        address _creditBackAddress
    ) external payable returns (uint256);
}

/**
 * @title Interface needed to call function setGateway of the L2GatewayRouter
 */
interface IL2GatewayRouter {
    function setGateway(
        address _gateway,
        uint256 _maxGas,
        uint256 _gasPriceBid,
        uint256 _maxSubmissionCost,
        address _creditBackAddress
    ) external payable returns (uint256);
}

contract ERC20L1BridgeableUpgradeable is Initializable {
    address private customGatewayAddress;
    address private routerAddress;
    bool private shouldRegisterGateway;

    function __ERC20L1BridgeableUpgradeable_init(
        address _customGatewayAddress,
        address _routerAddress
    ) internal initializer {
        customGatewayAddress = _customGatewayAddress;
        routerAddress = _routerAddress;
    }

    /// @dev we only set shouldRegisterGateway to true when in `registerTokenOnL2`
    function isArbitrumEnabled() external view returns (uint8) {
        if (!shouldRegisterGateway) {
            revert NotRegisteringGateway();
        }

        return uint8(0xb1);
    }

    /// @dev See {ICustomToken-registerTokenOnL2}
    function registerTokenOnL2(
        address l2CustomTokenAddress,
        uint256 maxSubmissionCostForCustomGateway,
        uint256 maxSubmissionCostForRouter,
        uint256 maxGasForCustomGateway,
        uint256 maxGasForRouter,
        uint256 gasPriceBid,
        uint256 valueForGateway,
        uint256 valueForRouter,
        address creditBackAddress
    ) external payable {
        // we temporarily set `shouldRegisterGateway` to true for the callback in registerTokenToL2 to succeed
        bool prev = shouldRegisterGateway;
        shouldRegisterGateway = true;

        IL1CustomGateway(customGatewayAddress).registerTokenToL2{ value: valueForGateway }(
            l2CustomTokenAddress,
            maxGasForCustomGateway,
            gasPriceBid,
            maxSubmissionCostForCustomGateway,
            creditBackAddress
        );

        IL2GatewayRouter(routerAddress).setGateway{ value: valueForRouter }(
            customGatewayAddress,
            maxGasForRouter,
            gasPriceBid,
            maxSubmissionCostForRouter,
            creditBackAddress
        );

        shouldRegisterGateway = prev;
    }

    error NotRegisteringGateway();
}
