import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
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

    // Testing flow for saleManager contract

    // Verify sale manager has correct owner, and correct tokenbeacon
    // createToken to deploy a token with beaconproxy
    // verify that the entire supply of the token is now on the SaleManager
    // try to edit sale

    // User flow
    // try to buy token with normal receive, everything should go fine
  });
});
