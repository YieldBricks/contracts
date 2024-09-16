// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.20;

import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { BeaconProxy } from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import { UpgradeableBeacon } from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Property } from "./Property.sol";
import { IOracle } from "./Oracle.sol";
import { TiersV1 as Tiers } from "./tiers/TiersV1.sol";

/**
 * @title SaleManager
 * @dev This contract manages the sales of tokens. It allows the owner to create tokens, create sales for those tokens, and edit sales. It also allows users to buy tokens and claim or cancel their purchases.
 */
contract SaleManager is Ownable2StepUpgradeable {
    using SafeERC20 for IERC20;

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
     * @dev Mapping of user to number of bought tokens.
     */
    mapping(address property => mapping(address user => uint256 purchasedTokens)) public purchasesPerPropertyPerUser;

    /**
     * @dev Mapping of tier to number of bought tokens.
     */
    mapping(address property => mapping(Tiers.Tier tier => uint256 purchasedTokens)) public purchasesPerPropertyPerTier;

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
    Tiers public tiers;

    /// @notice Contract constructor - disabled due to upgradeability
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract.
     * @param tokenBeacon_ The address of the token beacon.
     * @param owner_ The address of the owner.
     * @param oracle_ The address of the oracle.
     */
    function initialize(address tokenBeacon_, address owner_, address oracle_, address tiers_) public initializer {
        __Ownable2Step_init();
        __Ownable_init(owner_);
        tokenBeacon = UpgradeableBeacon(tokenBeacon_);
        oracle = IOracle(oracle_);
        tiers = Tiers(tiers_);
    }

    /**
     * @dev Sets a new token beacon for the contract.
     * @param tokenBeacon_ The address of the new token beacon.
     */
    function setTokenBeacon(address tokenBeacon_) external onlyOwner {
        tokenBeacon = UpgradeableBeacon(tokenBeacon_);

        emit TokenBeaconUpdated(tokenBeacon_);
    }

    /**
     * @dev Creates a new token.
     * @param name_ The name of the new token.
     * @param symbol_ The symbol of the new token.
     * @param cap_ The cap of the new token.
     */
    function createToken(string memory name_, string memory symbol_, uint256 cap_) external onlyOwner {
        BeaconProxy tokenProxy = new BeaconProxy(
            address(tokenBeacon),
            abi.encodeWithSelector(Property.initialize.selector, address(this), name_, symbol_, cap_)
        );
        tokenAddresses.push(address(tokenProxy));

        emit TokenDeployed(address(tokenProxy), name_, symbol_, cap_);
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

        emit FundsWithdrawn(_token);
    }

    /**
     * @dev Sets a new oracle for the contract.
     * @param oracle_ The address of the new oracle.
     */
    function setOracle(address oracle_) external onlyOwner {
        oracle = IOracle(oracle_);
        emit OracleUpdated(oracle_);
    }

    /**
     * @dev Sets a new tier calculator for the contract.
     * @param tiers_ The address of the new tier calculator.
     */
    function setTiers(address tiers_) external onlyOwner {
        tiers = Tiers(tiers_);
        emit TiersUpdated(tiers_);
    }

    /**
     * @dev Whitelists a payment token.
     * @param paymentToken The address of the payment token.
     * @param isWhitelisted The new whitelist status of the payment token.
     */
    function whitelistPaymentToken(address paymentToken, bool isWhitelisted) external onlyOwner {
        whitelistedPaymentTokens[paymentToken] = isWhitelisted;
        emit PaymentTokenWhitelisted(paymentToken, isWhitelisted);
    }

    /**
     * @dev Allows admin transfers of tokens to admin.
     * @param _property The address of the property token.
     */
    function adminTransferProperty(address _property, uint256 amount) external onlyOwner {
        Property property = Property(_property);
        property.transfer(msg.sender, amount);

        emit AdminTransferProperty(_property, amount);
    }

    /**
     * @dev Allows user to buy tokens.
     * @param _amount The amount of tokens to buy.
     * @param paymentTokenAddress The address of the payment token.
     * @param _property The address of the token to buy.
     */
    function buyTokens(uint256 _amount, address paymentTokenAddress, address _property) external {
        Tiers.Tier tier = tiers.getTier(msg.sender);
        Tiers.TierBenefits memory tierBenefits = tiers.getTierBenefits(tier);

        // check that sale is open
        if (block.timestamp < sales[_property].start - tierBenefits.earlyAccess) {
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

        if (block.timestamp < sales[_property].start) {
            if (
                (10000 * (_amount + purchasesPerPropertyPerUser[_property][msg.sender])) / property.totalSupply() >
                tierBenefits.walletLimit
            ) {
                revert TierWalletLimitReached();
            }
            if (
                (10000 * (_amount + purchasesPerPropertyPerTier[_property][tier])) / property.totalSupply() >
                tierBenefits.tierAllocation
            ) {
                revert TierTotalLimitReached();
            }
        }

        if (!whitelistedPaymentTokens[paymentTokenAddress]) {
            revert PaymentTokenNotWhitelisted(paymentTokenAddress);
        }

        IERC20 paymentToken = IERC20(paymentTokenAddress);

        (uint256 price, uint256 priceDecimals, uint256 tokenDecimals) = oracle.getTokenUSDPrice(paymentTokenAddress);

        // Calculate the amount of payment token needed for the transaction
        uint256 totalCost = (_amount * sales[_property].price * (10 ** priceDecimals) * (10 ** tokenDecimals)) / price;

        // Check that the sender has enough payment token and transfer
        if (paymentToken.allowance(msg.sender, address(this)) < totalCost) {
            revert InsufficientAllowance();
        }

        paymentToken.safeTransferFrom(msg.sender, address(this), totalCost);

        purchasesPerPropertyPerUser[_property][msg.sender] += _amount;
        purchasesPerPropertyPerTier[_property][tier] += _amount;

        // Try to send tokens to user, if it fails, add the amount to unclaimed tokens
        try property.transfer(msg.sender, _amount) {
            emit ClaimsProcessed(msg.sender, _property, _amount);
        } catch {
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
            emit ClaimsProcessed(msg.sender, unclaimed.propertyAddress, unclaimed.propertyAmount);
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
            emit ClaimsCancelled(msg.sender, unclaimed.propertyAddress, unclaimed.propertyAmount);
        }
        delete unclaimedByUser[msg.sender];
    }

    /**
     * @dev Allows for instant swaps of purchased tokens back for equivalent USDC if liquidity is available
     */
    function instantSwap(address property, address paymentTokenAddress, uint256 amount) external {
        // Transfer property from user to contract
        IERC20(property).transferFrom(msg.sender, address(this), amount);

        // Check property price in paymentToken
        (uint256 price, uint256 priceDecimals, uint256 tokenDecimals) = oracle.getTokenUSDPrice(paymentTokenAddress);

        // Calculate the amount of payment token needed for the transaction
        uint256 propertyPrice = (amount * sales[property].price * (10 ** priceDecimals) * (10 ** tokenDecimals)) /
            price;

        // Ensure the contract has enough paymentToken to fulfill the swap
        IERC20 paymentTokenContract = IERC20(paymentTokenAddress);
        uint256 contractBalance = paymentTokenContract.balanceOf(address(this));
        require(contractBalance >= propertyPrice, "Insufficient liquidity for swap");

        // Transfer paymentToken from contract to user
        paymentTokenContract.transfer(msg.sender, propertyPrice);

        // Emit an event for the swap
        emit InstantSwap(msg.sender, property, paymentTokenAddress, amount, propertyPrice);
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

    /**
     * @dev This error is thrown when a user tries to buy more tokens than their wallet limit allows.
     */
    error TierWalletLimitReached();

    /**
     * @dev This error is thrown when a user tries to buy more tokens than the entire tier has allocated.
     */
    error TierTotalLimitReached();

    /**
     * @dev Emitted when funds are withdrawn from the contract.
     * @param token The address of the token that was withdrawn.
     */
    event FundsWithdrawn(address token);

    /**
     * @dev Emitted when the oracle is updated.
     * @param oracle The address of the new oracle.
     */
    event OracleUpdated(address oracle);

    /**
     * @dev Emitted when the tiers are updated.
     * @param tiers The address of the new tiers.
     */
    event TiersUpdated(address tiers);

    /**
     * @dev Emitted when a payment token is whitelisted.
     * @param paymentToken The address of the payment token.
     * @param isWhitelisted The new whitelist status of the payment token.
     */
    event PaymentTokenWhitelisted(address paymentToken, bool isWhitelisted);

    /**
     * @dev Emitted when a property is transferred to an admin.
     * @param property The address of the property token.
     * @param amount The amount of the property token.
     */
    event AdminTransferProperty(address property, uint256 amount);

    /**
     * @dev Emitted when claims are processed.
     * @param user The address of the user who claimed tokens.
     * @param property The address of the property token.
     * @param amount The amount of the property token.
     */
    event ClaimsProcessed(address user, address property, uint256 amount);

    /**
     * @dev Emitted when claims are cancelled.
     * @param user The address of the user who cancelled claims.
     * @param property The address of the property token.
     * @param amount The amount of the property token.
     */
    event ClaimsCancelled(address user, address property, uint256 amount);

    /**
     * @dev Emitted when a new token is deployed.
     * @param property The address of the new token.
     * @param name The name of the new token.
     * @param symbol The symbol of the new token.
     * @param cap The cap of the new token.
     */
    event TokenDeployed(address indexed property, string name, string symbol, uint256 cap);

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
    event ClaimAdded(uint256 indexed transactionId, address sender, uint256 amount);

    /**
     * @dev Emitted when the token beacon is updated.
     * @param tokenBeacon The address of the new token beacon.
     */
    event TokenBeaconUpdated(address tokenBeacon);

    /**
     * @dev Emitted when a swap is processed.
     * @param user The address of the user who swapped tokens.
     * @param property The address of the property token.
     * @param amount The amount of the property token.
     */
    event InstantSwap(
        address indexed user,
        address indexed property,
        address indexed paymentToken,
        uint256 amount,
        uint256 propertyPrice
    );
}
