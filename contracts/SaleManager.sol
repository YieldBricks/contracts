// SPDX-License-Identifier: See LICENSE in root directory
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Property.sol";
import "./IOracle.sol";
import "./YBR.sol";

contract SaleManager is Ownable2StepUpgradeable {
    event TokenDeployed(address indexed property, string name, string symbol, uint256 cap, address compliance);
    event SaleCreated(address indexed property, uint256 start, uint256 end, uint256 price);
    event SaleModified(address indexed property, uint256 start, uint256 end, uint256 price);
    event ClaimAdded(uint indexed transactionId, address sender, uint amount);

    struct Sale {
        uint256 start;
        uint256 end;
        uint256 price; // Price in stablecoin (any can be used)
    }

    // Is the sale open for property with given address
    mapping(address => Sale) public sales;

    // unclaimed tokens (DoS, canTransfer, other reasons)
    mapping(address user => mapping(address property => uint256 unclaimed)) public unclaimedPropertiesByUser;
    mapping(address property => uint256 unclaimed) public unclaimedProperties;

    address[] public tokenAddresses;
    UpgradeableBeacon public tokenBeacon;

    YBR public ybr;
    IOracle public oracle;

    function initialize(address tokenBeacon_, address owner_, address _ybr) public initializer {
        __Ownable2Step_init();
        __Ownable_init(owner_);
        tokenBeacon = UpgradeableBeacon(tokenBeacon_);
        ybr = YBR(_ybr);
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
        token.transfer(owner(), token.balanceOf(address(this)));
    }

    // Admin functions for YBR and Oracle

    function setOracle(address _oracle) external onlyOwner {
        oracle = IOracle(_oracle);
    }

    function _verifyTier(address _property, address _user, uint256 _amount) internal {
        //
    }

    // Sale functions
    function buyTokens(uint256 _amount, address _property) external payable {
        // check that sale is open
        require(block.timestamp >= sales[_property].start, "Sale not started");
        require(block.timestamp <= sales[_property].end, "Sale ended");

        Property property = Property(_property);
        // Check there is enough supply left
        require(
            _amount + unclaimedProperties[_property] <= property.balanceOf(address(this)),
            "Not enough tokens left"
        );

        // Calculate the amount of YBR needed for the transaction
        uint256 totalCost = (_amount * sales[_property].price) * oracle.getYBRPrice();

        // Check that the sender has enough YBR and transfer
        require(ybr.balanceOf(msg.sender) >= totalCost, "Not enough funds");
        require(ybr.transferFrom(msg.sender, address(this), totalCost), "Transfer failed");

        // Try to send tokens to user, if it fails, add the amount to unclaimed tokens
        try property.transfer(msg.sender, _amount) {
            // success
        } catch {
            unclaimedPropertiesByUser[msg.sender][_property] += _amount;
            unclaimedProperties[_property] += _amount;
        }
    }

    function claimTokens(address _property) external {
        uint256 amount = unclaimedPropertiesByUser[msg.sender][_property];
        require(amount > 0, "No unclaimed tokens");
        unclaimedPropertiesByUser[msg.sender][_property] = 0;
        unclaimedProperties[_property] -= amount;
        Property(_property).transfer(msg.sender, amount);
    }

    // Will result in a 20% penalty
    function cancelPurchase(address _property) external {
        uint256 amount = unclaimedPropertiesByUser[msg.sender][_property];
        require(amount > 0, "No unclaimed tokens");
        unclaimedPropertiesByUser[msg.sender][_property] = 0;
        unclaimedProperties[_property] -= amount;
        // Send YBR back to user
        uint256 returnAmount = ((amount * sales[_property].price) * oracle.getYBRPrice() * 4) / 5;
        ybr.transfer(msg.sender, returnAmount);
    }
}
