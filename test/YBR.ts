import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import { deployYBRFixture } from "./YBR.fixture";

type FixtureReturnType = Awaited<Promise<PromiseLike<ReturnType<typeof deployYBRFixture>>>>;

describe("YBR", function () {
  before(async function () {
    this.loadFixture = loadFixture;
  });

  describe("Happy flow", function () {
    before(async function () {
      this.fixture = (await this.loadFixture(deployYBRFixture)) as FixtureReturnType;
    });

    it("YBR should have correct owner", async function () {
      const { ybr, multisig } = this.fixture as FixtureReturnType;
      expect(await ybr.owner()).to.equal(multisig.address);
    });

    // Initially all tokens should be on multisig, so first we distribute tokens from multisig to alice and bob.
    // Then we will check if the balances are correct.
    //
  });
});
