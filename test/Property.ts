import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import { deployPropertyFixture } from "./Property.fixture";

type FixtureReturnType = Awaited<Promise<PromiseLike<ReturnType<typeof deployPropertyFixture>>>>;

describe("Property", function () {
  before(async function () {
    this.loadFixture = loadFixture;
  });

  describe("Happy flow", function () {
    before(async function () {
      this.fixture = (await this.loadFixture(deployPropertyFixture)) as FixtureReturnType;
    });

    it("The initialize function should only be called once", async function () {
      const { property, multisig } = this.fixture;

      // Call the initialize function the second time and expect it to revert with a custom error
      await expect(property.initialize(multisig, "My Token", "MTK", 1000000)).to.be.revertedWithCustomError(
        property,
        "InvalidInitialization",
      );
    });

    it("Compliance should have correct owner", async function () {
      const { compliance, multisig } = this.fixture as FixtureReturnType;
      expect(await compliance.owner()).to.equal(multisig.address);
    });

    it("Send tokens from Alice to Bob and Charlie", async function () {
      const { property, alice, bob, charlie } = this.fixture as FixtureReturnType;
      await property.connect(alice).transfer(bob.address, 500000);
      await property.connect(alice).transfer(charlie.address, 500000);
      expect(await property.balanceOf(bob.address)).to.equal(500000);
      expect(await property.balanceOf(charlie.address)).to.equal(500000);
    });

    it("Multisig should be able to pause the contract and Alice and bob should not be able to transfer tokens", async function () {
      const { property, multisig, alice, bob } = this.fixture as FixtureReturnType;

      // Non multisig should not be able to pause
      await expect(property.connect(alice).pauseTransfers(true)).to.be.revertedWithCustomError(
        property,
        "OwnableUnauthorizedAccount",
      );

      await property.connect(multisig).pauseTransfers(true);
      expect(await property.paused()).to.be.true;

      // Noone should be able to transfer while paused
      await expect(property.connect(bob).transfer(alice.address, 1)).to.be.revertedWithCustomError(
        property,
        "EnforcedPause",
      );
      await expect(property.connect(alice).transfer(bob.address, 1)).to.be.revertedWithCustomError(
        property,
        "EnforcedPause",
      );
    });

    it("Multisig should be able to unpause the contract and Alice and bob should be able to transfer tokens", async function () {
      const { property, multisig, alice, bob } = this.fixture as FixtureReturnType;

      // Non multisig should not be able to unpause
      await expect(property.connect(alice).pauseTransfers(false)).to.be.revertedWithCustomError(
        property,
        "OwnableUnauthorizedAccount",
      );

      await property.connect(multisig).pauseTransfers(false);
      expect(await property.paused()).to.be.false;

      //Alice and Bob should be able to transfer
      await expect(property.connect(bob).transfer(alice.address, 5)).to.be.fulfilled;
      await expect(property.connect(alice).transfer(bob.address, 1)).to.be.fulfilled;
    });

    it("Multisig should be able to freeze any wallet ", async function () {
      const { property, alice, bob, charlie, multisig } = this.fixture as FixtureReturnType;

      // Non-multisig should not be able to freeze wallet
      await expect(property.connect(alice).freezeWallet(bob.address, true)).to.be.revertedWithCustomError(
        property,
        "OwnableUnauthorizedAccount",
      );

      // Multisig should be able to freeze wallet
      await property.connect(multisig).freezeWallet(alice.address, true);
      expect(await property.walletFrozen(alice.address)).to.be.true;

      // Alice should not be able to transfer tokens
      await expect(property.connect(alice).transfer(bob.address, 1)).to.be.revertedWithCustomError(
        property,
        "FrozenWalletError",
      );
      // Alice should not be able to receive tokens
      await expect(property.connect(bob).transfer(alice.address, 1)).to.be.revertedWithCustomError(
        property,
        "FrozenWalletError",
      );

      // Bob should be able to transfer tokens
      await expect(property.connect(bob).transfer(charlie.address, 1)).to.be.fulfilled;
    });

    it("Multisig should be able to unfreeze any wallet ", async function () {
      const { property, alice, bob, multisig } = this.fixture as FixtureReturnType;

      // Non-multisig should not be able to unfreeze wallet
      await expect(property.connect(bob).freezeWallet(alice.address, false)).to.be.revertedWithCustomError(
        property,
        "OwnableUnauthorizedAccount",
      );
      // Multisig should be able to unfreeze wallet
      await property.connect(multisig).freezeWallet(alice.address, false);
      expect(await property.walletFrozen(alice.address)).to.be.false;

      // Alice should be able to transfer tokens
      await expect(property.connect(alice).transfer(bob.address, 1)).to.be.fulfilled;
      // Bob should be able to transfer tokens
      await expect(property.connect(bob).transfer(alice.address, 5)).to.be.fulfilled;
    });

    it("Token holder (alice) should be able to transfer tokens to any other wallet (bob)", async function () {
      const { property, alice, bob } = this.fixture as FixtureReturnType;

      const transferAmount = BigInt(2);
      const expectedBobBalance = (await property.balanceOf(bob.address)) + transferAmount;

      await expect(property.connect(alice).transfer(bob.address, transferAmount)).to.be.fulfilled;
      expect(await property.balanceOf(bob.address)).to.equal(expectedBobBalance);
    });

    it("Token holder (alice) should be able to give permission (allowance) to any other wallet (charlie) to spend her tokens", async function () {
      const { property, alice, bob, charlie } = this.fixture as FixtureReturnType;

      // Alice can give permission to Charlie to spend her tokens
      await expect(property.connect(alice).approve(charlie.address, 1)).to.be.fulfilled;
      expect(await property.allowance(alice.address, charlie.address)).to.equal(1);

      // Charlie should be able to spend alice's tokens
      await expect(property.connect(charlie).transferFrom(alice.address, bob.address, 1)).to.be.fulfilled;

      // Charlie shouldn't be able to spend bob's tokens
      await expect(property.connect(charlie).transferFrom(bob.address, alice.address, 1)).to.be.reverted;

      // Charlie shouldn't be able to spend more of alice's tokens
      await expect(property.connect(charlie).transferFrom(alice.address, bob.address, 1)).to.be.reverted;
    });

    it("Token holder (alice) should be able to revoke permission (allowance) to any other wallet (charlie) to spend her tokens", async function () {
      const { property, alice, bob, charlie } = this.fixture as FixtureReturnType;

      // Make sure charlie has no allowance
      expect(await property.allowance(alice.address, charlie.address)).to.equal(0);

      // Alice gives more allowance to Charlie
      await property.connect(alice).approve(charlie.address, 2);

      // Make sure charlie has no allowance
      expect(await property.allowance(alice.address, charlie.address)).to.equal(2);

      // Let Charlie spend of Alice's tokens
      await property.connect(charlie).transferFrom(alice.address, bob.address, 1);

      // Alice can revoke permission to Charlie to spend 1 token
      await expect(property.connect(alice).approve(charlie.address, 0)).to.be.fulfilled;
      expect(await property.allowance(alice.address, charlie.address)).to.equal(0);

      // Charlie shouldn't be able to spend alice's tokens
      await expect(property.connect(charlie).transferFrom(alice.address, bob.address, 1)).to.be.reverted;
    });

    it("Token supply should be correct", async function () {
      const { property } = this.fixture as FixtureReturnType;
      expect(await property.totalSupply()).to.equal(1_000_000);
    });

    it("The force transfer function should work", async function () {
      const { property, alice, bob, multisig } = this.fixture as FixtureReturnType;

      const transferAmount = BigInt(1);
      const expectedAliceBalance = (await property.balanceOf(alice.address)) - transferAmount;
      const expectedMultisigBalance = (await property.balanceOf(multisig.address)) + transferAmount;

      // Only owner should be able to call it, noone else
      await expect(property.connect(alice).forceTransfer(bob.address, 1)).to.be.revertedWithCustomError(
        property,
        "OwnableUnauthorizedAccount",
      );

      await expect(property.connect(multisig).forceTransfer(alice.address, 1)).to.be.fulfilled;
      expect(await property.balanceOf(alice.address)).to.equal(expectedAliceBalance);
      expect(await property.balanceOf(multisig.address)).to.equal(expectedMultisigBalance);
    });

    it("Check nonce of an address", async function () {
      const { property, alice } = this.fixture as FixtureReturnType;
      expect(await property.nonces(alice.address)).to.be.equal(0);
    });
  });

  describe("ERC20Votes", function () {
    before(async function () {
      this.fixture = (await this.loadFixture(deployPropertyFixture)) as FixtureReturnType;
    });

    it("Property should have correct owner", async function () {
      const { property, multisig } = this.fixture as FixtureReturnType;
      expect(await property.owner()).to.equal(multisig.address);
    });

    it("Property should have correct CLOCK_MODE", async function () {
      const { property } = this.fixture as FixtureReturnType;
      expect(await property.clock()).to.equal(await time.latest());

      expect(await property.CLOCK_MODE()).to.equal("mode=timestamp");
    });

    it("Alice should have all the tokens initially", async function () {
      const { property, alice } = this.fixture as FixtureReturnType;
      expect(await property.balanceOf(alice.address)).to.equal(1_000_000);
    });

    it("Alice should have votes predeleageted", async function () {
      const { property, alice } = this.fixture as FixtureReturnType;
      expect(await property.getVotes(alice.address)).to.equal(1_000_000);
    });

    it("Votes should automatically delegate when transferring to other users", async function () {
      const { property, alice, bob, charlie } = this.fixture as FixtureReturnType;
      await property.connect(alice).transfer(bob.address, 500_000);
      await property.connect(alice).transfer(charlie.address, 500_000);
      expect(await property.balanceOf(bob.address)).to.equal(500_000);
      expect(await property.balanceOf(charlie.address)).to.equal(500_000);
      expect(await property.getVotes(bob.address)).to.equal(500_000);
      expect(await property.getVotes(charlie.address)).to.equal(500_000);
    });

    it("Votes should return when reconsolidating", async function () {
      const { property, alice, bob, charlie } = this.fixture as FixtureReturnType;
      await property.connect(bob).transfer(alice.address, 500_000);
      await property.connect(charlie).transfer(alice.address, 500_000);
      expect(await property.balanceOf(alice.address)).to.equal(1_000_000);
      expect(await property.getVotes(alice.address)).to.equal(1_000_000);
    });
  });

  describe("Reward Distribution", function () {
    before(async function () {
      this.fixture = (await this.loadFixture(deployPropertyFixture)) as FixtureReturnType;
    });

    it("Property should have correct owner", async function () {
      const { property, multisig } = this.fixture as FixtureReturnType;
      expect(await property.owner()).to.equal(multisig.address);
    });

    it("Alice distribute token", async function () {
      const { property, multisig, alice, bob, charlie } = this.fixture as FixtureReturnType;

      await property.connect(alice).transfer(multisig.address, 1_000_000);

      await property.connect(multisig).transfer(alice.address, 100_000);
      await property.connect(multisig).transfer(bob.address, 100_000);
      await property.connect(multisig).transfer(charlie.address, 10_000);
      expect(await property.balanceOf(alice.address)).to.equal(100_000);
      expect(await property.balanceOf(bob.address)).to.equal(100_000);
      expect(await property.balanceOf(charlie.address)).to.equal(10_000);
    });

    it("Create a new reward distribution claim with YBR for Property", async function () {
      const { property, ybr, multisig, propertyAddress, ybrAddress } = this.fixture as FixtureReturnType;
      const rewardAmount = 100_000;
      await ybr.connect(multisig).approve(propertyAddress, rewardAmount);
      await property.connect(multisig).addYield(ybrAddress, rewardAmount, await time.latest());

      const claim = await property.claims(0);
      expect(claim.rewardToken).to.equal(ybrAddress);
      expect(claim.amount).to.equal(rewardAmount);
    });

    it("Test pastVotes and pastTotalSupply from ERC20Votes", async function () {
      const { property, alice } = this.fixture as FixtureReturnType;

      const claim = await property.claims(0);
      const currentTime = await time.latest();

      expect(await property.getPastTotalSupply(claim.timestamp)).to.equal(1_000_000);
      expect(await property.getPastVotes(alice.address, claim.timestamp)).to.equal(100_000);
      // Use current time - 1, to get current block just getVotes should be used
      expect(await property.getPastTotalSupply(currentTime - 1)).to.equal(1_000_000);
      expect(await property.getPastVotes(alice.address, currentTime - 1)).to.equal(100_000);
    });

    it("Users can claim their rewards proportionally if they have sufficient tier", async function () {
      const { property, alice, bob, charlie, ybr } = this.fixture as FixtureReturnType;

      await property.connect(alice).collectYields();
      await property.connect(bob).collectYields();
      await property.connect(charlie).collectYields();

      const aliceYield = await ybr.balanceOf(alice.address);
      const bobYield = await ybr.balanceOf(bob.address);
      const charlieYield = await ybr.balanceOf(charlie.address);

      expect(aliceYield).to.equal(10_000);
      // Bob can't claim more because he has a lower tier
      expect(bobYield).to.equal(1_000);
      expect(charlieYield).to.equal(1_000);
    });
  });
});
