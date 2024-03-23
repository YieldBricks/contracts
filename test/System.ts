import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";

import { deploySystemFixture } from "./System.fixture";

describe("System", function () {
  describe("Deployment And Upgrades", function () {
    it("All contracts should have the multisig as owner", async function () {
      const { compliance, saleManager, propertyBeacon: tokenBeacon, multisig } = await loadFixture(deploySystemFixture);
      expect(await compliance.owner()).to.equal(multisig.address);
      expect(await saleManager.owner()).to.equal(multisig.address);
      expect(await tokenBeacon.owner()).to.equal(multisig.address);
    });

    // Test upgradeability of all contracts
    it("All contracts should be upgradeable", async function () {
      const { compliance, saleManager, propertyBeacon: tokenBeacon, multisig } = await loadFixture(deploySystemFixture);

      // Upgrade Compliance
      const ComplianceV2 = await ethers.getContractFactory("ComplianceV2");
      const complianceV2 = await upgrades.upgradeProxy(compliance, ComplianceV2);
      expect(await complianceV2.owner()).to.equal(multisig.address);

      console.log("ComplianceV2 deployed to:", await complianceV2.getAddress());

      // Upgrade SaleManager
      const SaleManagerV2 = await ethers.getContractFactory("SaleManagerV2");
      const saleManagerV2 = await upgrades.upgradeProxy(saleManager, SaleManagerV2);
      expect(await saleManagerV2.owner()).to.equal(multisig.address);

      console.log("SaleManagerV2 deployed to:", await saleManagerV2.getAddress());

      // Upgrade TokenBeacon
      const PropertyV2 = await ethers.getContractFactory("PropertyV2");
      const propertyV2 = await upgrades.prepareUpgrade(tokenBeacon, PropertyV2);

      const tokenBeaconWithMultisig = tokenBeacon.connect(multisig) as Contract;
      await tokenBeaconWithMultisig.upgradeTo(await propertyV2);

      expect(await tokenBeacon.owner()).to.equal(multisig.address);
    });
  });
});
