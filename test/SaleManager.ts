import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { deploySystemFixture } from "./System.fixture";

type FixtureReturnType = Awaited<Promise<PromiseLike<ReturnType<typeof deploySystemFixture>>>>;

describe("SaleManager", function () {
  before(async function () {
    this.loadFixture = loadFixture;
  });

  describe("Flow", function () {
    before(async function () {
      this.fixture = (await this.loadFixture(deploySystemFixture)) as FixtureReturnType;
    });

    it("SaleManager should have correct owner", async function () {
      const { saleManager, multisig } = this.fixture as FixtureReturnType;
      expect(await saleManager.owner()).to.equal(multisig.address);
    });

    it("SaleManager should have correct tokenBeacon", async function () {
      const { saleManager, tokenBeaconAddress } = this.fixture as FixtureReturnType;
      expect(await saleManager.tokenBeacon()).to.equal(tokenBeaconAddress);
    });

    it("Create token and verify that the entire supply is on the SaleManager", async function () {
      const { saleManager, compliance, saleManagerAddress, complianceAddress, multisig } = this
        .fixture as FixtureReturnType;

      const name = "TestToken";
      const symbol = "TT";
      const cap = 1000000;
      console.log("SaleManager", saleManagerAddress);

      expect(compliance.canTransfer(saleManagerAddress, saleManagerAddress, 1));

      await expect(saleManager.connect(multisig).createToken(name, symbol, cap, complianceAddress)).to.emit(
        saleManager,
        "TokenDeployed",
      );
      const tokenAddress = await saleManager.tokenAddresses(0);

      const token = await ethers.getContractAt("Token", tokenAddress);
      expect(await token.balanceOf(saleManagerAddress)).to.equal(cap);
    });

    // create sale by calling below function on saleManager
    //    function createSale(address _token, uint256 _start, uint256 _end, uint256 _price) external onlyOwner {
    //     sales[_token] = Sale(_start, _end, _price);
    //     emit SaleCreated(_token, _start, _end, _price);
    // }
    it("Create sale for token", async function () {
      const { saleManager, multisig, saleManagerAddress, tokenBeaconAddress, complianceAddress } = this
        .fixture as FixtureReturnType;

      const tokenAddress = await saleManager.tokenAddresses(0);

      const startTime = await time.latest();
      const endTime = (await time.latest()) + 3600 * 24 * 7;
      const price = 100;

      await expect(saleManager.connect(multisig).createSale(tokenAddress, startTime, endTime, price)).to.emit(
        saleManager,
        "SaleCreated",
      );

      const sale = await saleManager.sales(tokenAddress);
      expect(sale.start).to.equal(startTime);
      expect(sale.end).to.equal(endTime);
      expect(sale.price).to.equal(price);
    });

    // function buyTokens(uint256 _amount, Token _token) external payable {
    //     address tokenAddress = address(_token);

    //     // check that sale is open
    //     require(block.timestamp >= sales[tokenAddress].start, "Sale not started");
    //     require(block.timestamp <= sales[tokenAddress].end, "Sale ended");

    //     // Check there is enough supply left
    //     require(
    //         _amount + unclaimedTokensByToken[tokenAddress] + _token.totalSupply() <= _token.cap(),
    //         "Not enough tokens left"
    //     );
    //     require(msg.value == _amount * sales[tokenAddress].price, "Not enough funds");

    //     // Try to mint tokens to user, if it fails, add the amount to unclaimed tokens
    //     try _token.transfer(msg.sender, _amount) {
    //         // success
    //     } catch {
    //         unclaimedTokensByUserByToken[msg.sender][tokenAddress] += _amount;
    //         unclaimedTokensByToken[tokenAddress] += _amount;
    //     }
    // }

    it("User can buy token", async function () {
      const { saleManager, alice } = this.fixture as FixtureReturnType;

      const tokenAddress = await saleManager.tokenAddresses(0);

      await saleManager.connect(alice).buyTokens(1, tokenAddress, { value: 10000 });
    });

    // Testing flow for saleManager contract

    // Verify sale manager has correct owner, and correct tokenbeacon
    // createToken to deploy a token with beaconproxy
    // verify that the entire supply of the token is now on the SaleManager
    // try to edit sale

    // User flow
    // try to buy token with normal receive, everything should go fine
  });
});
