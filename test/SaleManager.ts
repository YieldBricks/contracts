import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { DenialOfService, DenialOfService__factory } from "../types";
import { deploySystemFixture } from "./System.fixture";
import { DAY } from "./utils";

type FixtureReturnType = Awaited<Promise<PromiseLike<ReturnType<typeof deploySystemFixture>>>>;

describe("SaleManager", function () {
  before(async function () {
    this.loadFixture = loadFixture;
  });

  describe("Happy flow", function () {
    before(async function () {
      this.fixture = (await this.loadFixture(deploySystemFixture)) as FixtureReturnType;
    });

    it("SaleManager should have correct owner", async function () {
      const { saleManager, multisig } = this.fixture as FixtureReturnType;
      expect(await saleManager.owner()).to.equal(multisig.address);
    });

    it("SaleManager should have correct tokenBeacon", async function () {
      const { saleManager, propertyBeaconAddress: tokenBeaconAddress } = this.fixture as FixtureReturnType;
      expect(await saleManager.tokenBeacon()).to.equal(tokenBeaconAddress);
    });

    it("Create property and verify that the entire supply is on the SaleManager", async function () {
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
      const propertyAddress = await saleManager.tokenAddresses(0);

      const property = await ethers.getContractAt("Property", propertyAddress);
      expect(await property.balanceOf(saleManagerAddress)).to.equal(cap);
    });

    // create sale by calling below function on saleManager
    //    function createSale(address _token, uint256 _start, uint256 _end, uint256 _price) external onlyOwner {
    //     sales[_token] = Sale(_start, _end, _price);
    //     emit SaleCreated(_token, _start, _end, _price);
    // }
    it("Create sale for property", async function () {
      const { saleManager, multisig } = this.fixture as FixtureReturnType;

      const propertyAddress = await saleManager.tokenAddresses(0);

      const startTime = (await time.latest()) + DAY;
      const endTime = (await time.latest()) + 7 * DAY;
      const price = 100;

      await expect(saleManager.connect(multisig).createSale(propertyAddress, startTime, endTime, price)).to.emit(
        saleManager,
        "SaleCreated",
      );

      const sale = await saleManager.sales(propertyAddress);
      expect(sale.start).to.equal(startTime);
      expect(sale.end).to.equal(endTime);
      expect(sale.price).to.equal(price);
    });

    it("User can't buy property before sale starts", async function () {
      const { saleManager, alice } = this.fixture as FixtureReturnType;

      const propertyAddress = await saleManager.tokenAddresses(0);

      await expect(saleManager.connect(alice).buyTokens(1, propertyAddress, { value: 100 })).to.be.revertedWith(
        "Sale not started",
      );
    });

    it("User can buy property during sale duration", async function () {
      const { saleManager, alice } = this.fixture as FixtureReturnType;

      await time.increase(DAY);

      const propertyAddress = await saleManager.tokenAddresses(0);

      expect(saleManager.connect(alice).buyTokens(1, propertyAddress, { value: 100 }));
    });

    it("Denial of Service attempt", async function () {
      const { saleManager } = this.fixture as FixtureReturnType;

      const DenialOfService = (await ethers.getContractFactory("DenialOfService")) as DenialOfService__factory;
      const denialOfService = (await DenialOfService.deploy()) as DenialOfService;

      const propertyAddress = await saleManager.tokenAddresses(0);
      const property = await ethers.getContractAt("Property", propertyAddress);

      expect(denialOfService.buyTokens(saleManager, property, 1, { value: 100 }));

      await expect(await saleManager.unclaimedTokensByToken(propertyAddress)).to.equal(1);
      await expect(
        await saleManager.unclaimedTokensByUserByToken(await denialOfService.getAddress(), propertyAddress),
      ).to.equal(1);

      // Try to claimTokens directly
    });

    it("User can't buy property after sale ends", async function () {
      const { saleManager, alice } = this.fixture as FixtureReturnType;

      await time.increase(7 * DAY);

      const propertyAddress = await saleManager.tokenAddresses(0);

      await expect(saleManager.connect(alice).buyTokens(1, propertyAddress, { value: 100 })).to.be.revertedWith(
        "Sale ended",
      );
    });
  });
});
