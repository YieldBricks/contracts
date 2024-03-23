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
    // });
  });
});
