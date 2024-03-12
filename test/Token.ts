import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import { deployTokenFixture } from "./Token.fixture";

type FixtureReturnType = Awaited<Promise<PromiseLike<ReturnType<typeof deployTokenFixture>>>>;

describe("SaleManager", function () {
  before(async function () {
    this.loadFixture = loadFixture;
  });

  describe("Happy flow", function () {
    before(async function () {
      this.fixture = (await this.loadFixture(deployTokenFixture)) as FixtureReturnType;
    });

    it("Compliance should have correct owner", async function () {
      const { compliance, multisig } = this.fixture as FixtureReturnType;
      expect(await compliance.owner()).to.equal(multisig.address);
    });

    it("Send tokens from deploy to Alice and Bob", async function () {
      const { token, alice, bob, charlie } = this.fixture as FixtureReturnType;
      await token.connect(alice).transfer(bob.address, 500000);
      await token.connect(alice).transfer(charlie.address, 500000);
      expect(await token.balanceOf(bob.address)).to.equal(500000);
      expect(await token.balanceOf(charlie.address)).to.equal(500000);
    });

    it("Pausing should work", async function () {
      const { token, bob, alice, charlie, multisig } = this.fixture as FixtureReturnType;
      await token.connect(multisig).pause();
      expect(await token.paused()).to.be.true;

      // Non multisig should not be able to pause
      await expect(token.connect(alice).pause()).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");

      // Noone should be able to transfer while paused
      await expect(token.connect(bob).transfer(alice.address, 1)).to.be.revertedWithCustomError(token, "EnforcedPause");
      await expect(token.connect(charlie).transfer(bob.address, 1)).to.be.revertedWithCustomError(
        token,
        "EnforcedPause",
      );
    });

    it("Unpausing should work", async function () {
      const { token, alice, bob, multisig } = this.fixture as FixtureReturnType;
      await token.connect(multisig).unpause();
      expect(await token.paused()).to.be.false;

      // Everyone should be able to transfer now
      await expect(token.connect(bob).transfer(alice.address, 1)).to.be.fulfilled;
      await expect(token.connect(alice).transfer(bob.address, 1)).to.be.fulfilled;
    });

    it("Freezing of addresses should work", async function () {
      const { token, alice, bob, multisig } = this.fixture as FixtureReturnType;
      await token.connect(multisig).freezeWallet(alice.address, true);
      expect(await token.frozen(alice.address)).to.be.true;

      await expect(token.connect(alice).transfer(bob.address, 1)).to.be.revertedWith("Wallet frozen");
    });

    it("Unfreezing of addresses should work", async function () {
      const { token, alice, multisig } = this.fixture as FixtureReturnType;
      await token.connect(multisig).freezeWallet(alice.address, false);
      expect(await token.frozen(alice.address)).to.be.false;
    });
  });
});
