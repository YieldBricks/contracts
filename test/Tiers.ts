import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { parseEther } from "ethers";

import { deployYBRFixture } from "./YBR.fixture";
import { DAY } from "./utils";

type FixtureReturnType = Awaited<Promise<PromiseLike<ReturnType<typeof deployYBRFixture>>>>;

describe("Tiers", function () {
  before(async function () {
    this.loadFixture = loadFixture;
  });

  describe("Tiers", function () {
    before(async function () {
      this.fixture = (await this.loadFixture(deployYBRFixture)) as FixtureReturnType;
    });

    it("The initialize function should only be called once", async function () {
      const { tiers, ybrAddress, multisig } = this.fixture;

      // Call the initialize function the second time and expect it to revert with a custom error
      await expect(tiers.initialize(multisig.address, ybrAddress)).to.be.revertedWithCustomError(
        tiers,
        "InvalidInitialization",
      );
    });

    it("Tiers should have correct owner", async function () {
      const { tiers, multisig } = this.fixture as FixtureReturnType;
      expect(await tiers.owner()).to.equal(multisig.address);
    });

    it("Tiers should have correct YBR address", async function () {
      const { tiers, ybrAddress } = this.fixture as FixtureReturnType;
      expect(await tiers.ybr()).to.equal(ybrAddress);
    });

    it("Multisig should be able to distribute tokens to Alice and Bob", async function () {
      const { ybr, alice, multisig } = this.fixture as FixtureReturnType;
      await expect(ybr.connect(multisig).transfer(alice.address, parseEther("50000"))).to.be.fulfilled;
    });

    /*
    ROOKIE,
        EXPLORER,
        CAMPER,
        BUILDER,
        TYCOON,
        GURU
        */

    it("Check user satisfies ROOKIE tier by default", async function () {
      const { tiers, alice } = this.fixture as FixtureReturnType;

      // Alice should be in ROOKIE tier
      const tier = await tiers.getTier(alice.address);

      expect(await tiers.getTierBenefits(tier)).to.deep.equal([0n, 0n, 500n, 100n]);
    });

    it("Check user satisfies GURU when they have 50000 YBR", async function () {
      const { tiers, ybr, alice } = this.fixture as FixtureReturnType;

      await ybr.connect(alice).delegate(alice.address);

      // Alice should be in GURU tier
      const tier = await tiers.getTier(alice.address);

      expect(await tiers.getTierBenefits(tier)).to.deep.equal([5n, 259200n, 3000n, 1000n]);
    });

    it("Check user satisfies TYCOON when they have 20000 YBR", async function () {
      const { tiers, ybr, alice, multisig } = this.fixture as FixtureReturnType;

      await ybr.connect(alice).transfer(multisig.address, parseEther("30000"));

      await time.increase(86400 * 30);

      // Alice should be in TYCOON tier
      const tier = await tiers.getTier(alice.address);

      expect(await tiers.getTierBenefits(tier)).to.deep.equal([4n, 172800n, 2000n, 800n]);
    });

    it("Check user satisfies BUILDER when they have 5000 YBR", async function () {
      const { tiers, ybr, alice, multisig } = this.fixture as FixtureReturnType;

      await ybr.connect(alice).transfer(multisig.address, parseEther("15000"));

      await time.increase(86400 * 30);

      // Alice should be in BUILDER tier
      const tier = await tiers.getTier(alice.address);

      expect(await tiers.getTierBenefits(tier)).to.deep.equal([3n, 86400n, 1000n, 600n]);
    });

    it("Check user satisfies CAMPER when they have 1000 YBR", async function () {
      const { tiers, ybr, alice, multisig } = this.fixture as FixtureReturnType;

      await ybr.connect(alice).transfer(multisig.address, parseEther("4000"));

      await time.increase(86400 * 30);

      // Alice should be in CAMPER tier
      const tier = await tiers.getTier(alice.address);

      expect(await tiers.getTierBenefits(tier)).to.deep.equal([2n, 43200n, 1000n, 400n]);
    });

    it("Check user satisfies EXPLORER when they have 1 YBR", async function () {
      const { tiers, ybr, alice, multisig } = this.fixture as FixtureReturnType;

      await ybr.connect(alice).transfer(multisig.address, parseEther("999"));

      await time.increase(86400 * 30);

      // Alice should be in EXPLORER tier
      const tier = await tiers.getTier(alice.address);

      expect(await tiers.getTierBenefits(tier)).to.deep.equal([1n, 21600n, 500n, 200n]);
    });

    it("Check user satisfies ROOKIE when they have 0 YBR", async function () {
      const { tiers, ybr, alice, multisig } = this.fixture as FixtureReturnType;

      await ybr.connect(alice).transfer(multisig.address, parseEther("1"));

      await time.increase(86400 * 30);

      // Alice should be in ROOKIE tier
      const tier = await tiers.getTier(alice.address);

      expect(await tiers.getTierBenefits(tier)).to.deep.equal([0n, 0n, 500n, 100n]);
    });

    it("Check admin can set temporary tiers", async function () {
      const { tiers, alice, multisig } = this.fixture as FixtureReturnType;

      await tiers.connect(multisig).setTierOverride(alice.address, 3); // 3 is BUILDER

      // Alice should be in BUILDER tier
      const tier = await tiers.getTier(alice.address);

      expect(await tiers.getTierBenefits(tier)).to.deep.equal([3n, 86400n, 1000n, 600n]);
    });
  });

  describe("Holding Averages", function () {
    before(async function () {
      this.fixture = (await this.loadFixture(deployYBRFixture)) as FixtureReturnType;
    });

    it("Multisig should be able to distribute tokens to Alice and Bob", async function () {
      const { ybr, alice, multisig } = this.fixture as FixtureReturnType;
      await expect(ybr.connect(multisig).transfer(alice.address, parseEther("50000"))).to.be.fulfilled;
    });

    it("Check balance when there is only one data point", async function () {
      const { tiers, ybr, alice } = this.fixture as FixtureReturnType;

      await ybr.connect(alice).delegate(alice.address);

      await time.increase(100);

      // Get current timestamp in seconds (will be before block.timestamp)
      const now = await time.latest();
      let averageBalance = await tiers.getAverageBalance(alice.address, now - 1000);

      // Before the delegation, balance should be 0
      expect(averageBalance).to.equal(parseEther("0"));
      averageBalance = await tiers.getAverageBalance(alice.address, now);

      expect(averageBalance).to.equal(parseEther("50000"));
    });

    it("Check balance when there are two data points", async function () {
      const { tiers, ybr, alice, multisig } = this.fixture as FixtureReturnType;

      await time.increase(DAY * 30);

      await ybr.connect(alice).transfer(multisig.address, parseEther("50000"));

      const lastCheckpoint = await ybr.checkpoints(alice.address, 1);

      // Check average for point 15 days from last checkpoint, so it's half-way between 0 and 50000

      const averageBalance = await tiers.getAverageBalance(alice.address, lastCheckpoint[0] + BigInt(DAY) * 15n);

      expect(averageBalance).to.equal(parseEther("25000"));
    });

    it("Fuzz various transfers and compare average balance", async function () {
      const { tiers, ybr, alice, multisig } = this.fixture as FixtureReturnType;
    });
  });
});
