// SPDX-License-Identifier: See LICENSE in root directory
pragma solidity ^0.8.20;

import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { BeaconProxy } from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import { UpgradeableBeacon } from "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Property } from "./Property.sol";
import { YBR } from "./YBR.sol";
import { IOracle } from "./Oracle.sol";

contract SaleManager is Ownable2StepUpgradeable {
    using SafeERC20 for IERC20;

    event TokenDeployed(address indexed property, string name, string symbol, uint256 cap, address compliance);
    event SaleCreated(address indexed property, uint256 start, uint256 end, uint256 price);
    event SaleModified(address indexed property, uint256 start, uint256 end, uint256 price);
    event ClaimAdded(uint indexed transactionId, address sender, uint amount);

    struct Sale {
        uint256 start;
        uint256 end;
        uint256 price; // Price in USD
    }

    // Is the sale open for property with given address
    mapping(address => Sale) public sales;

    // unclaimed tokens (DoS, canTransfer, other reasons)
    mapping(address user => Unclaimed[] unclaimed) public unclaimedByUser;
    mapping(address property => uint256 unclaimedProperties) public unclaimedProperties;
    mapping(address paymentToken => bool isWhitelisted) public whitelistedPaymentTokens;

    struct Unclaimed {
        address propertyAddress;
        address paymentTokenAddress;
        uint256 propertyAmount;
        uint256 paymentTokenAmount;
    }

    address[] public tokenAddresses;
    UpgradeableBeacon public tokenBeacon;

    IOracle public oracle;

    function initialize(address tokenBeacon_, address owner_, address oracle_) public initializer {
        __Ownable2Step_init();
        __Ownable_init(owner_);
        tokenBeacon = UpgradeableBeacon(tokenBeacon_);
        oracle = IOracle(oracle_);
    }

    // Admin functions

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

    function createSale(address _token, uint256 _start, uint256 _end, uint256 _price) external onlyOwner {
        sales[_token] = Sale(_start, _end, _price);
        emit SaleCreated(_token, _start, _end, _price);
    }

    function editSale(address _token, uint256 _start, uint256 _end, uint256 _price) external onlyOwner {
        // deploy Token contract like a factory, add a sale

        sales[_token] = Sale(_start, _end, _price);
        emit SaleModified(_token, _start, _end, _price);
    }

    // Used to pull funds periodically
    function withdrawFunds(address _token) external onlyOwner {
        IERC20 token = IERC20(_token);
        token.safeTransfer(msg.sender, token.balanceOf(address(this)));
    }

    // Admin functions for YBR and Oracle
    function setOracle(address oracle_) external onlyOwner {
        oracle = IOracle(oracle_);
    }

    function whitelistPaymentToken(address paymentToken, bool isWhitelisted) external onlyOwner {
        whitelistedPaymentTokens[paymentToken] = isWhitelisted;
    }

    // Sale functions
    function buyTokens(uint256 _amount, address paymentTokenAddress, address _property) external {
        // check that sale is open
        require(block.timestamp >= sales[_property].start, "Sale not started");
        require(block.timestamp <= sales[_property].end, "Sale ended");

        Property property = Property(_property);
        // Check there is enough supply left
        require(
            _amount + unclaimedProperties[_property] <= property.balanceOf(address(this)),
            "Not enough tokens left"
        );

        require(whitelistedPaymentTokens[paymentTokenAddress], "Payment token not whitelisted");

        // Calculate the amount of payment token needed for the transaction
        uint256 totalCost = _amount * sales[_property].price * oracle.getTokensPerUSD(paymentTokenAddress);

        IERC20 paymentToken = IERC20(paymentTokenAddress);

        // Check that the sender has enough YBR and transfer
        require(paymentToken.balanceOf(msg.sender) >= totalCost, "Not enough funds");
        require(paymentToken.transferFrom(msg.sender, address(this), totalCost), "Transfer failed");

        // Try to send tokens to user, if it fails, add the amount to unclaimed tokens
        try property.transfer(msg.sender, _amount) {} catch {
            unclaimedByUser[msg.sender].push(Unclaimed(_property, paymentTokenAddress, _amount, totalCost));
            unclaimedProperties[_property] += _amount;
        }
    }

    function claimTokens() external {
        require(unclaimedByUser[msg.sender].length > 0, "No unclaimed tokens");
        for (uint256 i = 0; i < unclaimedByUser[msg.sender].length; i++) {
            Unclaimed memory unclaimed = unclaimedByUser[msg.sender][i];
            Property property = Property(unclaimed.propertyAddress);
            property.transfer(msg.sender, unclaimed.propertyAmount);
            unclaimedProperties[unclaimed.propertyAddress] -= unclaimed.propertyAmount;
        }
        delete unclaimedByUser[msg.sender];
    }

    // Will result in a 20% penalty
    function cancelPurchases() external {
        require(unclaimedByUser[msg.sender].length > 0, "No unclaimed tokens");
        for (uint256 i = 0; i < unclaimedByUser[msg.sender].length; i++) {
            Unclaimed memory unclaimed = unclaimedByUser[msg.sender][i];
            IERC20 paymentToken = IERC20(unclaimed.paymentTokenAddress);
            paymentToken.transfer(msg.sender, (unclaimed.paymentTokenAmount * 80) / 100);
            unclaimedProperties[unclaimed.propertyAddress] -= unclaimed.propertyAmount;
        }
        delete unclaimedByUser[msg.sender];
    }
}
