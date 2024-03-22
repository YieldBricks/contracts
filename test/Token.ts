import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import { deployTokenFixture } from "./Token.fixture";

type FixtureReturnType = Awaited<Promise<PromiseLike<ReturnType<typeof deployTokenFixture>>>>;

describe("Token", function () {
  before(async function () {
    this.loadFixture = loadFixture;
  });

  describe("Happy flow", function () {
    before(async function () {
      this.fixture = (await this.loadFixture(deployTokenFixture)) as FixtureReturnType;
    });

    it("The initialize function should only be called once", async function () {
      const { token, compliance, multisig } = this.fixture;

      // Call the initialize function the second time and expect it to revert with a custom error
      await expect(token.initialize(compliance, multisig, "My Token", "MTK", 1000000)).to.be.revertedWithCustomError(
        token,
        "InvalidInitialization",
      );
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

      // Non multisig should not be able to unpause
      await expect(token.connect(alice).unpause()).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");

      // Everyone should be able to transfer now
      await expect(token.connect(bob).transfer(alice.address, 1)).to.be.fulfilled;
      await expect(token.connect(alice).transfer(bob.address, 1)).to.be.fulfilled;
    });

    it("Freezing of addresses should work", async function () {
      const { token, alice, bob, multisig } = this.fixture as FixtureReturnType;
      await token.connect(multisig).freezeWallet(alice.address, true);
      expect(await token.frozen(alice.address)).to.be.true;

      await expect(token.connect(alice).transfer(bob.address, 1)).to.be.revertedWith("Wallet frozen");

      // Non multisig should not be able to freeze wallet
      await expect(token.connect(alice).freezeWallet(bob.address, true)).to.be.reverted;
    });

    it("Unfreezing of addresses should work", async function () {
      const { token, alice, multisig } = this.fixture as FixtureReturnType;
      await token.connect(multisig).freezeWallet(alice.address, false);
      expect(await token.frozen(alice.address)).to.be.false;
    });

    // it("The updateStakeValue function should update the stake value correctly", async function () {
    //   const { token, alice } = this.fixture as FixtureReturnType;

    //   // Mint some token to the user
    //   //const initialBalance = ethers.utils.parseEther("1.0");
    //   await token.mint(alice.address, 1);

    //   // Wait for some time
    //   await new Promise((resolve) => setTimeout(resolve, 1000));

    //   // Action
    //   await token.updateStakeValue(alice.address);

    //   // Assertion
    //   const updatedStakeValue = await token.stakeValue(alice.address);
    //   expect(updatedStakeValue).to.be.above(0);
    // });
  });
});
