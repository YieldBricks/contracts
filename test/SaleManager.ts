import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { deploySaleManagerFixture } from "./SaleManager.fixture";
import { DAY } from "./utils";

type FixtureReturnType = Awaited<Promise<PromiseLike<ReturnType<typeof deploySaleManagerFixture>>>>;

describe("SaleManager", function () {
  before(async function () {
    this.loadFixture = loadFixture;
  });

  describe("Happy flow", function () {
    before(async function () {
      this.fixture = (await this.loadFixture(deploySaleManagerFixture)) as FixtureReturnType;
    });

    it("SaleManager should have correct owner", async function () {
      const { saleManager, multisig } = this.fixture as FixtureReturnType;
      expect(await saleManager.owner()).to.equal(multisig.address);
    });

    it("SaleManager should have correct tokenBeacon", async function () {
      const { saleManager, propertyBeaconAddress: tokenBeaconAddress } = this.fixture as FixtureReturnType;
      expect(await saleManager.tokenBeacon()).to.equal(tokenBeaconAddress);
    });

    it("Oracle should be able to set and return price", async function () {
      const { mockOracle, ybrAddress } = this.fixture as FixtureReturnType;

      const price = 100;
      await mockOracle.setPrice(price);
      expect(await mockOracle.getUSDPrice(ybrAddress)).to.equal(price);
    });

    it("Create property and verify that the entire supply is on the SaleManager", async function () {
      const { saleManager, compliance, saleManagerAddress, complianceAddress, multisig } = this
        .fixture as FixtureReturnType;

      const name = "TestToken";
      const symbol = "TT";
      const cap = 1000000;
      console.log("SaleManager", saleManagerAddress);

      expect(compliance.canTransfer(saleManagerAddress, saleManagerAddress));

      await expect(saleManager.connect(multisig).createToken(name, symbol, cap, complianceAddress)).to.emit(
        saleManager,
        "TokenDeployed",
      );
      const propertyAddress = await saleManager.tokenAddresses(0);

      const property = await ethers.getContractAt("Property", propertyAddress);
      expect(await property.balanceOf(saleManagerAddress)).to.equal(cap);
    });

    it("Create sale for property", async function () {
      const { saleManager, multisig } = this.fixture as FixtureReturnType;

      const propertyAddress = await saleManager.tokenAddresses(0);

      const startTime = (await time.latest()) + DAY;
      const endTime = (await time.latest()) + 7 * DAY;
      const price = 100; // Price in USD

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
      const { saleManager, alice, ybrAddress } = this.fixture as FixtureReturnType;

      const propertyAddress = await saleManager.tokenAddresses(0);

      await expect(
        saleManager.connect(alice).buyTokens(1, ybrAddress, propertyAddress, { value: 100 }),
      ).to.be.revertedWith("Sale not started");
    });

    it("User can buy property during sale duration", async function () {
      const { saleManager, alice, ybrAddress } = this.fixture as FixtureReturnType;

      await time.increase(DAY);

      const propertyAddress = await saleManager.tokenAddresses(0);

      expect(saleManager.connect(alice).buyTokens(1, ybrAddress, propertyAddress, { value: 100 }));
    });

    it("User can't buy property after sale ends", async function () {
      const { saleManager, alice, ybrAddress } = this.fixture as FixtureReturnType;

      await time.increase(7 * DAY);

      const propertyAddress = await saleManager.tokenAddresses(0);

      await expect(
        saleManager.connect(alice).buyTokens(1, ybrAddress, propertyAddress, { value: 100 }),
      ).to.be.revertedWith("Sale ended");
    });
  });
});
