// SPDX-License-Identifier: See LICENSE in root directory
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import { PropertyV2 } from "./PropertyV2.sol";

contract SaleManagerV2 is Ownable2StepUpgradeable {
    event TokenDeployed(address indexed token, string name, string symbol, uint256 cap, address compliance);
    event SaleCreated(address indexed token, uint256 start, uint256 end, uint256 price);
    event SaleModified(address indexed token, uint256 start, uint256 end, uint256 price);
    event ClaimAdded(uint indexed transactionId, address sender, uint amount);

    struct Sale {
        uint256 start;
        uint256 end;
        uint256 price;
    }

    // Is the sale open for token with given address
    mapping(address => Sale) public sales;

    // unclaimed tokens
    mapping(address => mapping(address => uint256)) public unclaimedTokensByUserByToken;
    mapping(address => uint256) public unclaimedTokensByToken;

    address[] public tokenAddresses;
    UpgradeableBeacon public tokenBeacon;

    address[] public stablecoins;

    function initialize(address tokenBeacon_, address owner_) public initializer {
        __Ownable2Step_init();
        __Ownable_init(owner_);
        tokenBeacon = UpgradeableBeacon(tokenBeacon_);
    }

    function createToken(
        string memory name_,
        string memory symbol_,
        uint256 cap_,
        address compliance_
    ) external onlyOwner {
        address tokenAddress = address(
            new BeaconProxy(
                address(tokenBeacon),
                abi.encodeWithSignature(
                    "initialize(address,string memory,string memory,uint256)",
                    compliance_,
                    name_,
                    symbol_,
                    cap_
                )
            )
        );
        emit TokenDeployed(tokenAddress, name_, symbol_, cap_, compliance_);
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

    // Sale functions
    function buyTokens(uint256 _amount, address _token) external payable {
        // check that sale is open
        require(block.timestamp >= sales[_token].start, "Sale not started");
        require(block.timestamp <= sales[_token].end, "Sale ended");

        PropertyV2 token = PropertyV2(_token);

        // Check there is enough supply left
        require(
            _amount + unclaimedTokensByToken[_token] + token.totalSupply() <= token.cap(),
            "Not enough tokens left"
        );
        require(msg.value == _amount * sales[_token].price, "Not enough funds");

        // Try to mint tokens to user, if it fails, add the amount to unclaimed tokens
        try token.transfer(msg.sender, _amount) {
            // success
        } catch {
            unclaimedTokensByUserByToken[msg.sender][_token] += _amount;
            unclaimedTokensByToken[_token] += _amount;
        }
    }

    function claimTokens(address _token) external {
        address tokenAddress = address(_token);

        uint256 amount = unclaimedTokensByUserByToken[msg.sender][tokenAddress];
        require(amount > 0, "No unclaimed tokens");
        unclaimedTokensByUserByToken[msg.sender][tokenAddress] = 0;
        unclaimedTokensByToken[tokenAddress] -= amount;
        PropertyV2(_token).transfer(msg.sender, amount);
    }

    // Will result in a 20% penalty
    function cancelPurchase(address _token) external {
        uint256 amount = unclaimedTokensByUserByToken[msg.sender][_token];
        require(amount > 0, "No unclaimed tokens");
        unclaimedTokensByUserByToken[msg.sender][_token] = 0;
        unclaimedTokensByToken[_token] -= amount;
        payable(msg.sender).transfer((amount * sales[_token].price * 80) / 100);
    }
}
