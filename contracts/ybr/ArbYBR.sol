// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.20;

/**
 * @title YieldBricks (YBR) Token
 * @dev This contract implements an ERC20 token with additional features like burnability,
 * pausability, capping, voting, and permit. It also includes a feature to freeze wallets.
 * @author Noah Jelich
 */
import { ERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {
    ERC20BurnableUpgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import {
    ERC20VotesUpgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import {
    ERC20PausableUpgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import {
    ERC20CappedUpgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20CappedUpgradeable.sol";
import {
    ERC20PermitUpgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { NoncesUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/NoncesUpgradeable.sol";
import { ERC20L2BridgeableUpgradeable } from "./ERC20L2BridgeableUpgradeable.sol";
import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";
import { YBRBase } from "./YBRBase.sol";

/**
 * @title YieldBricks (YBR) Token Contract
 * @notice This contract is for the YieldBricks token, which is an ERC20 token with additional features.
 */
contract ArbYBR is YBRBase, ERC20L2BridgeableUpgradeable {
    // /// @notice Contract constructor - disabled due to upgradeability
    // /// @custom:oz-upgrades-unsafe-allow constructor
    // constructor() {
    //     _disableInitializers();
    // }

    /**
     * @notice Initializes the contract
     * @dev This function replaces the constructor for upgradeable contracts.
     * @param owner_ The initial owner of the contract.
     */
    function initialize(address owner_, address _customGatewayAddress, address _l1TokenAddress) external initializer {
        __YBR_init(owner_);
        __ERC20L2BridgeableUpgradeable_init(_customGatewayAddress, _l1TokenAddress);
    }

    /**
     * @notice should increase token supply by amount, and should only be callable by the L2Gateway.
     */
    function bridgeMint(address account, uint256 amount) external override onlyL2Gateway {
        _mint(account, amount);
    }

    /**
     * @notice should decrease token supply by amount, and should only be callable by the L2Gateway.
     */
    function bridgeBurn(address account, uint256 amount) external override onlyL2Gateway {
        _burn(account, amount);
    }
}
