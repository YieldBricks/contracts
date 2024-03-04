import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { deploySystemFixture } from "./System.fixture";

describe("System", function () {
  describe("Deployment", function () {
    it("All contracts should have the correct owner", async function () {
      const { compliance, saleManager, tokenBeacon, owner } = await loadFixture(deploySystemFixture);
      expect(await compliance.owner()).to.equal(owner.address);
      expect(await saleManager.owner()).to.equal(owner.address);
      expect(await tokenBeacon.owner()).to.equal(owner.address);
    });

});
