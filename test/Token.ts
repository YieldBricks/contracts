import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { deploySystemFixture } from "./System.fixture";

describe("System", function () {
  describe("Deployment", function () {
    it("All contracts should have the correct owner", async function () {
      const { compliance, saleManager, tokenBeacon, multisig } = await loadFixture(deploySystemFixture);
      console.log("Owner: ", multisig.address);
      console.log("Compliance: ", await compliance.owner());
      expect(await compliance.owner()).to.equal(multisig.address);
      expect(await saleManager.owner()).to.equal(multisig.address);
      expect(await tokenBeacon.owner()).to.equal(multisig.address);
    });
  });
});
