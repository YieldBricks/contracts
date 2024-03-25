import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
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
      const { property, compliance, multisig } = this.fixture;

      // Call the initialize function the second time and expect it to revert with a custom error
      await expect(property.initialize(compliance, multisig, "My Token", "MTK", 1000000)).to.be.revertedWithCustomError(
        property,
        "InvalidInitialization",
      );
    });

    it("Compliance should have correct owner", async function () {
      const { compliance, multisig } = this.fixture as FixtureReturnType;
      expect(await compliance.owner()).to.equal(multisig.address);
    });

    it("Send tokens from deploy to Alice and Bob", async function () {
      const { property: property, alice, bob, charlie } = this.fixture as FixtureReturnType;
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
        "WalletFrozen",
      );
      // Alice should not be able to receive tokens
      await expect(property.connect(bob).transfer(alice.address, 1)).to.be.revertedWithCustomError(
        property,
        "WalletFrozen",
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

    // it("Multisig should have all the tokens initially", async function () {
    //   const { ybr, multisig } = this.fixture as FixtureReturnType;
    //   expect(await ybr.balanceOf(multisig.address)).to.equal(1_000_000_000);
    // });

    // it("Multisig should have no votes prior to delegating", async function () {
    //   const { ybr, multisig } = this.fixture as FixtureReturnType;
    //   expect(await ybr.getVotes(multisig.address)).to.equal(0);
    // });

    // it("Multisig should be able to delegate votes to itself", async function () {
    //   const { ybr, multisig } = this.fixture as FixtureReturnType;
    //   await ybr.connect(multisig).delegate(multisig.address);
    //   expect(await ybr.getVotes(multisig.address)).to.equal(1_000_000_000);
    // });

    // it("Votes disappear when transferred to non-delegated address", async function () {
    //   const { ybr, multisig, alice } = this.fixture as FixtureReturnType;
    //   await ybr.connect(multisig).transfer(alice.address, 100_000_000);
    //   expect(await ybr.getVotes(multisig.address)).to.equal(900_000_000);
    //   expect(await ybr.getVotes(alice.address)).to.equal(0);
    // });

    // it("Votes reappear when transferred back to delegated address", async function () {
    //   const { ybr, multisig, alice } = this.fixture as FixtureReturnType;
    //   await ybr.connect(alice).transfer(multisig.address, 100_000_000);
    //   expect(await ybr.getVotes(multisig.address)).to.equal(1_000_000_000);
    //   expect(await ybr.getVotes(alice.address)).to.equal(0);
    // });

    // it("User delegates votes to multisig after transfer", async function () {
    //   const { ybr, multisig, bob } = this.fixture as FixtureReturnType;
    //   await ybr.connect(multisig).transfer(bob.address, 100_000_000);
    //   expect(await ybr.getVotes(multisig.address)).to.equal(900_000_000);
    //   expect(await ybr.getVotes(bob.address)).to.equal(0);
    //   await ybr.connect(bob).delegate(multisig.address);
    //   expect(await ybr.getVotes(multisig.address)).to.equal(1_000_000_000);
    //   expect(await ybr.getVotes(bob.address)).to.equal(0);
    //   expect(await ybr.balanceOf(bob.address)).to.equal(100_000_000);

    //   await ybr.connect(bob).transfer(multisig.address, 100_000_000);
    // });

    // it("User delegates votes to multisig before transfer", async function () {
    //   const { ybr, multisig, bob } = this.fixture as FixtureReturnType;
    //   await ybr.connect(bob).delegate(multisig.address);
    //   await ybr.connect(multisig).transfer(bob.address, 100_000_000);
    //   expect(await ybr.getVotes(multisig.address)).to.equal(1_000_000_000);
    //   expect(await ybr.getVotes(bob.address)).to.equal(0);
    //   expect(await ybr.balanceOf(bob.address)).to.equal(100_000_000);

    //   await ybr.connect(bob).transfer(multisig.address, 100_000_000);
    // });
  });

  // it("Pausing should work", async function () {
  //   const { property, bob, alice, charlie, multisig } = this.fixture as FixtureReturnType;
  //   await property.connect(multisig).pause();
  //   expect(await property.paused()).to.be.true;

  //   // Non multisig should not be able to pause
  //   await expect(property.connect(alice).pause()).to.be.revertedWithCustomError(property, "OwnableUnauthorizedAccount");

  //   // Noone should be able to transfer while paused
  //   await expect(property.connect(bob).transfer(alice.address, 1)).to.be.revertedWithCustomError(property, "EnforcedPause");
  //   await expect(property.connect(charlie).transfer(bob.address, 1)).to.be.revertedWithCustomError(
  //     property,
  //     "EnforcedPause",
  //   );
  // });

  // it("Unpausing should work", async function () {
  //   const { property, alice, bob, multisig } = this.fixture as FixtureReturnType;
  //   await property.connect(multisig).unpause();
  //   expect(await property.paused()).to.be.false;

  //   // Non multisig should not be able to unpause
  //   await expect(property.connect(alice).unpause()).to.be.revertedWithCustomError(property, "OwnableUnauthorizedAccount");

  //   // Everyone should be able to transfer now
  //   await expect(property.connect(bob).transfer(alice.address, 1)).to.be.fulfilled;
  //   await expect(property.connect(alice).transfer(bob.address, 1)).to.be.fulfilled;
  // });

  // it("Freezing of addresses should work", async function () {
  //   const { property, alice, bob, multisig } = this.fixture as FixtureReturnType;
  //   await property.connect(multisig).freezeWallet(alice.address, true);
  //   expect(await property.frozen(alice.address)).to.be.true;

  //   await expect(property.connect(alice).transfer(bob.address, 1)).to.be.revertedWith("Wallet frozen");

  //   // Non multisig should not be able to freeze wallet
  //   await expect(property.connect(alice).freezeWallet(bob.address, true)).to.be.reverted;
  // });

  // it("Unfreezing of addresses should work", async function () {
  //   const { property, alice, multisig } = this.fixture as FixtureReturnType;
  //   await property.connect(multisig).freezeWallet(alice.address, false);
  //   expect(await property.frozen(alice.address)).to.be.false;
  // });

  // it("The updateStakeValue function should update the stake value correctly", async function () {
  //   const { property, alice } = this.fixture as FixtureReturnType;

  //   // Mint some property to the user
  //   //const initialBalance = ethers.utils.parseEther("1.0");
  //   await property.mint(alice.address, 1);

  //   // Wait for some time
  //   await new Promise((resolve) => setTimeout(resolve, 1000));

  //   // Action
  //   await property.updateStakeValue(alice.address);

  //   // Assertion
  //   const updatedStakeValue = await property.stakeValue(alice.address);
  //   expect(updatedStakeValue).to.be.above(0);
  //});
});
