// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.20;

import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { BeaconProxy } from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import { UpgradeableBeacon } from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Property } from "./Property.sol";
import { YBR } from "./YBR.sol";
import { IOracle } from "./Oracle.sol";

/**
 * @title SaleManager
 * @dev This contract manages the sales of tokens. It allows the owner to create tokens, create sales for those tokens, and edit sales. It also allows users to buy tokens and claim or cancel their purchases.
 */
contract SaleManager is Ownable2StepUpgradeable {
    using SafeERC20 for IERC20;

    /**
     * @dev Emitted when a new token is deployed.
     * @param property The address of the new token.
     * @param name The name of the new token.
     * @param symbol The symbol of the new token.
     * @param cap The cap of the new token.
     * @param compliance The compliance address of the new token.
     */
    event TokenDeployed(address indexed property, string name, string symbol, uint256 cap, address compliance);

    /**
     * @dev Emitted when a new sale is created.
     * @param property The address of the token for which the sale is created.
     * @param start The start time of the sale.
     * @param end The end time of the sale.
     * @param price The price of the token in the sale.
     */
    event SaleCreated(address indexed property, uint256 start, uint256 end, uint256 price);

    /**
     * @dev Emitted when a sale is modified.
     * @param property The address of the token for which the sale is modified.
     * @param start The new start time of the sale.
     * @param end The new end time of the sale.
     * @param price The new price of the token in the sale.
     */
    event SaleModified(address indexed property, uint256 start, uint256 end, uint256 price);

    /**
     * @dev Emitted when a claim is added.
     * @param transactionId The ID of the transaction.
     * @param sender The address of the sender of the transaction.
     * @param amount The amount of the transaction.
     */
    event ClaimAdded(uint indexed transactionId, address sender, uint amount);

    /**
     * @dev Struct representing a sale.
     * @param start The start time of the sale.
     * @param end The end time of the sale.
     * @param price The price of the token in the sale (in USD).
     */
    struct Sale {
        uint256 start;
        uint256 end;
        uint256 price;
    }

    /**
     * @dev Mapping of token addresses to their respective sales.
     */
    mapping(address => Sale) public sales;

    /**
     * @dev Mapping of users to their unclaimed tokens.
     */
    mapping(address => Unclaimed[]) public unclaimedByUser;

    /**
     * @dev Mapping of token addresses to their unclaimed properties.
     */
    mapping(address => uint256) public unclaimedProperties;

    /**
     * @dev Mapping of payment tokens to their whitelist status.
     */
    mapping(address => bool) public whitelistedPaymentTokens;

    /**
     * @dev Struct representing unclaimed tokens.
     * @param propertyAddress The address of the token.
     * @param paymentTokenAddress The address of the payment token.
     * @param propertyAmount The amount of the token.
     * @param paymentTokenAmount The amount of the payment token.
     */
    struct Unclaimed {
        address propertyAddress;
        address paymentTokenAddress;
        uint256 propertyAmount;
        uint256 paymentTokenAmount;
    }

    /**
     * @dev Array of token addresses.
     */
    address[] public tokenAddresses;

    /**
     * @dev Beacon for upgradeable tokens.
     */
    UpgradeableBeacon public tokenBeacon;

    /**
     * @dev Oracle for price feeds.
     */
    IOracle public oracle;

    /**
     * @dev Initializes the contract.
     * @param tokenBeacon_ The address of the token beacon.
     * @param owner_ The address of the owner.
     * @param oracle_ The address of the oracle.
     */
    function initialize(address tokenBeacon_, address owner_, address oracle_) public initializer {
        __Ownable2Step_init();
        __Ownable_init(owner_);
        tokenBeacon = UpgradeableBeacon(tokenBeacon_);
        oracle = IOracle(oracle_);
    }

    /**
     * @dev Creates a new token.
     * @param name_ The name of the new token.
     * @param symbol_ The symbol of the new token.
     * @param cap_ The cap of the new token.
     * @param compliance_ The compliance address of the new token.
     */
    function createToken(
        string memory name_,
        string memory symbol_,
        uint256 cap_,
        address compliance_
    ) external onlyOwner {
        BeaconProxy tokenProxy = new BeaconProxy(
            address(tokenBeacon),
            abi.encodeWithSelector(Property.initialize.selector, compliance_, address(this), name_, symbol_, cap_)
        );
        tokenAddresses.push(address(tokenProxy));

        emit TokenDeployed(address(tokenProxy), name_, symbol_, cap_, compliance_);
    }

    /**
     * @dev Creates a new sale for a token.
     * @param _token The address of the token for which the sale is created.
     * @param _start The start time of the sale.
     * @param _end The end time of the sale.
     * @param _price The price of the token in the sale.
     */
    function createSale(address _token, uint256 _start, uint256 _end, uint256 _price) external onlyOwner {
        sales[_token] = Sale(_start, _end, _price);
        emit SaleCreated(_token, _start, _end, _price);
    }

    /**
     * @dev Edits an existing sale for a token.
     * @param _token The address of the token for which the sale is edited.
     * @param _start The new start time of the sale.
     * @param _end The new end time of the sale.
     * @param _price The new price of the token in the sale.
     */
    function editSale(address _token, uint256 _start, uint256 _end, uint256 _price) external onlyOwner {
        sales[_token] = Sale(_start, _end, _price);
        emit SaleModified(_token, _start, _end, _price);
    }

    /**
     * @dev Withdraws funds from the contract.
     * @param _token The address of the token to withdraw.
     */
    function withdrawFunds(address _token) external onlyOwner {
        IERC20 token = IERC20(_token);
        token.safeTransfer(msg.sender, token.balanceOf(address(this)));
    }

    /**
     * @dev Sets a new oracle for the contract.
     * @param oracle_ The address of the new oracle.
     */
    function setOracle(address oracle_) external onlyOwner {
        oracle = IOracle(oracle_);
    }

    /**
     * @dev Whitelists a payment token.
     * @param paymentToken The address of the payment token.
     * @param isWhitelisted The new whitelist status of the payment token.
     */
    function whitelistPaymentToken(address paymentToken, bool isWhitelisted) external onlyOwner {
        whitelistedPaymentTokens[paymentToken] = isWhitelisted;
    }

    /**
     * @dev Allows user to buy tokens.
     * @param _amount The amount of tokens to buy.
     * @param paymentTokenAddress The address of the payment token.
     * @param _property The address of the token to buy.
     */
    function buyTokens(uint256 _amount, address paymentTokenAddress, address _property) external {
        // check that sale is open
        if (block.timestamp < sales[_property].start) {
            revert SaleNotStarted(_property);
        }
        if (block.timestamp > sales[_property].end) {
            revert SaleEnded(_property);
        }

        Property property = Property(_property);
        // Check there is enough supply left
        if (_amount + unclaimedProperties[_property] > property.balanceOf(address(this))) {
            revert NotEnoughTokensLeft();
        }

        if (!whitelistedPaymentTokens[paymentTokenAddress]) {
            revert PaymentTokenNotWhitelisted(paymentTokenAddress);
        }

        // Calculate the amount of payment token needed for the transaction
        uint256 totalCost = _amount * sales[_property].price * oracle.getTokensPerUSD(paymentTokenAddress);

        IERC20 paymentToken = IERC20(paymentTokenAddress);

        // Check that the sender has enough payment token and transfer
        if (paymentToken.allowance(msg.sender, address(this)) < totalCost) {
            revert InsufficientAllowance();
        }

        paymentToken.safeTransferFrom(msg.sender, address(this), totalCost);

        // Try to send tokens to user, if it fails, add the amount to unclaimed tokens
        try property.transfer(msg.sender, _amount) {} catch {
            unclaimedByUser[msg.sender].push(Unclaimed(_property, paymentTokenAddress, _amount, totalCost));
            unclaimedProperties[_property] += _amount;
        }
    }

    /**
     * @dev Allows user to claim unclaimed tokens.
     */
    function claimTokens() external {
        if (unclaimedByUser[msg.sender].length == 0) {
            revert NoUnclaimedTokens(msg.sender);
        }
        for (uint256 i = 0; i < unclaimedByUser[msg.sender].length; i++) {
            Unclaimed memory unclaimed = unclaimedByUser[msg.sender][i];
            Property property = Property(unclaimed.propertyAddress);
            property.transfer(msg.sender, unclaimed.propertyAmount);
            unclaimedProperties[unclaimed.propertyAddress] -= unclaimed.propertyAmount;
        }
        delete unclaimedByUser[msg.sender];
    }

    /**
     * @dev Cancels purchases and refunds 80% of the payment token.
     */
    function cancelPurchases() external {
        if (unclaimedByUser[msg.sender].length == 0) {
            revert NoUnclaimedTokens(msg.sender);
        }
        for (uint256 i = 0; i < unclaimedByUser[msg.sender].length; i++) {
            Unclaimed memory unclaimed = unclaimedByUser[msg.sender][i];
            IERC20 paymentToken = IERC20(unclaimed.paymentTokenAddress);
            paymentToken.transfer(msg.sender, (unclaimed.paymentTokenAmount * 80) / 100);
            unclaimedProperties[unclaimed.propertyAddress] -= unclaimed.propertyAmount;
        }
        delete unclaimedByUser[msg.sender];
    }

    /**
     * @dev This error is thrown when a user tries to claim tokens but there are no unclaimed tokens associated with their address.
     * @param user The address of the user who is trying to claim tokens.
     */
    error NoUnclaimedTokens(address user);

    /**
     * @dev This error is thrown when a user tries to buy tokens from a sale that has not started yet.
     * @param property The address of the property whose sale has not started.
     */
    error SaleNotStarted(address property);

    /**
     * @dev This error is thrown when a user tries to buy tokens from a sale that has already ended.
     * @param property The address of the property whose sale has ended.
     */
    error SaleEnded(address property);

    /**
     * @dev This error is thrown when a user tries to buy more tokens than are available in the sale.
     */
    error NotEnoughTokensLeft();

    /**
     * @dev This error is thrown when a user tries to buy tokens using a payment token that is not whitelisted.
     * @param paymentToken The address of the payment token that is not whitelisted.
     */
    error PaymentTokenNotWhitelisted(address paymentToken);

    /**
     * @dev This error is thrown when a user does not have enough allowance to buy the desired amount of tokens.
     */
    error InsufficientAllowance();
}
