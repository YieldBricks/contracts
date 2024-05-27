import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { parseEther } from "ethers";

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

    it("The initialize function should only be called once", async function () {
      const { ybr, multisig } = this.fixture;

      // Call the initialize function the second time and expect it to revert with a custom error
      await expect(ybr.initialize(multisig)).to.be.revertedWithCustomError(ybr, "InvalidInitialization");
    });

    it("YBR should have correct owner", async function () {
      const { ybr, multisig } = this.fixture as FixtureReturnType;
      expect(await ybr.owner()).to.equal(multisig.address);
    });

    it("Check token name and symbol", async function () {
      const { ybr } = this.fixture as FixtureReturnType;
      expect(await ybr.name()).to.equal("YieldBricks");
      expect(await ybr.symbol()).to.equal("YBR");
    });

    it("Multisig should be able to distribute tokens to Alice and Bob", async function () {
      const { ybr, alice, bob, multisig } = this.fixture as FixtureReturnType;
      await expect(ybr.connect(multisig).transfer(alice.address, parseEther("100000"))).to.be.fulfilled;
      await expect(ybr.connect(multisig).transfer(bob.address, parseEther("100000"))).to.be.fulfilled;
    });

    it("Property should have correct CLOCKMODE", async function () {
      const { ybr } = this.fixture as FixtureReturnType;
      expect(await ybr.clock()).to.equal(await time.latest());

      expect(await ybr.CLOCK_MODE()).to.equal("mode=timestamp");
    });

    it("Alice and Bob should have the correct amount of tokens", async function () {
      const { ybr, alice, bob } = this.fixture as FixtureReturnType;

      expect(await ybr.balanceOf(alice.address)).to.equal(parseEther("100000"));
      expect(await ybr.balanceOf(bob.address)).to.equal(parseEther("100000"));
    });

    it("Multisig should be able to pause the contract and Alice and bob should not be able to transfer tokens", async function () {
      const { ybr, multisig, alice, bob } = this.fixture as FixtureReturnType;

      // Non multisig should not be able to pause
      await expect(ybr.connect(alice).pauseTransfers(true)).to.be.revertedWithCustomError(
        ybr,
        "OwnableUnauthorizedAccount",
      );

      await ybr.connect(multisig).pauseTransfers(true);
      expect(await ybr.paused()).to.be.true;

      // Noone should be able to transfer while paused
      await expect(ybr.connect(bob).transfer(alice.address, parseEther("1"))).to.be.revertedWithCustomError(
        ybr,
        "EnforcedPause",
      );
      await expect(ybr.connect(alice).transfer(bob.address, parseEther("1"))).to.be.revertedWithCustomError(
        ybr,
        "EnforcedPause",
      );
    });

    it("Multisig should be able to unpause the contract and Alice and bob should be able to transfer tokens", async function () {
      const { ybr, multisig, alice, bob } = this.fixture as FixtureReturnType;

      // Non multisig should not be able to unpause
      await expect(ybr.connect(alice).pauseTransfers(false)).to.be.revertedWithCustomError(
        ybr,
        "OwnableUnauthorizedAccount",
      );

      await ybr.connect(multisig).pauseTransfers(false);
      expect(await ybr.paused()).to.be.false;

      //Alice and Bob should be able to transfer
      await expect(ybr.connect(bob).transfer(alice.address, parseEther("1"))).to.be.fulfilled;
      await expect(ybr.connect(alice).transfer(bob.address, parseEther("1"))).to.be.fulfilled;
    });

    it("Multisig should be able to freeze any wallet ", async function () {
      const { ybr, alice, bob, multisig } = this.fixture as FixtureReturnType;

      // Non-multisig should not be able to freeze wallet
      await expect(ybr.connect(alice).freezeWallet(bob.address, true)).to.be.revertedWithCustomError(
        ybr,
        "OwnableUnauthorizedAccount",
      );

      // Multisig should be able to freeze wallet
      await ybr.connect(multisig).freezeWallet(alice.address, true);
      expect(await ybr.walletFrozen(alice.address)).to.be.true;

      // Alice should not be able to transfer tokens
      await expect(ybr.connect(alice).transfer(bob.address, parseEther("1"))).to.be.revertedWithCustomError(
        ybr,
        "FrozenWalletError",
      );
      // Alice should not be able to receive tokens
      await expect(ybr.connect(bob).transfer(alice.address, parseEther("1"))).to.be.revertedWithCustomError(
        ybr,
        "FrozenWalletError",
      );

      // Bob should be able to transfer tokens
      await expect(ybr.connect(bob).transfer(multisig.address, parseEther("1"))).to.be.fulfilled;
    });

    it("Multisig should be able to unfreeze any wallet ", async function () {
      const { ybr, alice, bob, multisig } = this.fixture as FixtureReturnType;

      // Non-multisig should not be able to unfreeze wallet
      await expect(ybr.connect(bob).freezeWallet(alice.address, false)).to.be.revertedWithCustomError(
        ybr,
        "OwnableUnauthorizedAccount",
      );

      // Multisig should be able to freeze wallet
      await ybr.connect(multisig).freezeWallet(alice.address, false);
      expect(await ybr.walletFrozen(alice.address)).to.be.false;

      // Alice should be able to transfer tokens
      await expect(ybr.connect(alice).transfer(bob.address, parseEther("1"))).to.be.fulfilled;
      // Bob should be able to transfer tokens
      await expect(ybr.connect(bob).transfer(alice.address, parseEther("1"))).to.be.fulfilled;
    });

    it("Token holder (alice) should be able to transfer tokens to any other wallet (bob)", async function () {
      const { ybr, alice, bob } = this.fixture as FixtureReturnType;

      const transferAmount = parseEther("2");
      const expectedBobBalance = (await ybr.balanceOf(bob.address)) + transferAmount;

      await expect(ybr.connect(alice).transfer(bob.address, transferAmount)).to.be.fulfilled;
      expect(await ybr.balanceOf(bob.address)).to.equal(expectedBobBalance);
    });

    it("Token holder (alice) should be able to give permission (allowance) to any other wallet (charlie) to spend her tokens", async function () {
      const { ybr, alice, bob, charlie } = this.fixture as FixtureReturnType;

      // Alice can give permission to Charlie to spend her tokens
      await expect(ybr.connect(alice).approve(charlie.address, parseEther("1"))).to.be.fulfilled;
      expect(await ybr.allowance(alice.address, charlie.address)).to.equal(parseEther("1"));

      // Charlie should be able to spend alice's tokens
      await expect(ybr.connect(charlie).transferFrom(alice.address, bob.address, parseEther("1"))).to.be.fulfilled;

      // Charlie shouldn't be able to spend bob's tokens
      await expect(ybr.connect(charlie).transferFrom(bob.address, alice.address, parseEther("1"))).to.be.reverted;

      // Charlie shouldn't be able to spend more of alice's tokens
      await expect(ybr.connect(charlie).transferFrom(alice.address, bob.address, parseEther("1"))).to.be.reverted;
    });

    it("Token holder (alice) should be able to revoke permission (allowance) to any other wallet (charlie) to spend her tokens", async function () {
      const { ybr, alice, bob, charlie } = this.fixture as FixtureReturnType;

      // Make sure charlie has no allowance
      expect(await ybr.allowance(alice.address, charlie.address)).to.equal(0);

      // Alice gives more allowance to Charlie
      await ybr.connect(alice).approve(charlie.address, parseEther("2"));

      // Make sure charlie has no allowance
      expect(await ybr.allowance(alice.address, charlie.address)).to.equal(parseEther("2"));

      // Let Charlie spend of Alice's tokens
      await ybr.connect(charlie).transferFrom(alice.address, bob.address, parseEther("1"));

      // Alice can revoke permission to Charlie to spend 1 token
      await expect(ybr.connect(alice).approve(charlie.address, 0)).to.be.fulfilled;
      expect(await ybr.allowance(alice.address, charlie.address)).to.equal(0);

      // Charlie shouldn't be able to spend alice's tokens
      await expect(ybr.connect(charlie).transferFrom(alice.address, bob.address, parseEther("1"))).to.be.reverted;
    });

    it("Check nonce of an address", async function () {
      const { ybr, alice } = this.fixture as FixtureReturnType;
      expect(await ybr.nonces(alice.address)).to.be.equal(0);
    });

    it("Token supply should be correct", async function () {
      const { ybr } = this.fixture as FixtureReturnType;
      expect(await ybr.totalSupply()).to.equal(parseEther("1000000000"));
    });
  });

  describe("ERC20Votes", function () {
    before(async function () {
      this.fixture = (await this.loadFixture(deployYBRFixture)) as FixtureReturnType;
    });

    it("YBR should have correct owner", async function () {
      const { ybr, multisig } = this.fixture as FixtureReturnType;
      expect(await ybr.owner()).to.equal(multisig.address);
    });

    it("Multisig should have all the tokens initially", async function () {
      const { ybr, multisig } = this.fixture as FixtureReturnType;
      expect(await ybr.balanceOf(multisig.address)).to.equal(parseEther("1000000000"));
    });

    it("Multisig should have no votes prior to delegating", async function () {
      const { ybr, multisig } = this.fixture as FixtureReturnType;
      expect(await ybr.getVotes(multisig.address)).to.equal(0);
    });

    it("Multisig should be able to delegate votes to itself", async function () {
      const { ybr, multisig } = this.fixture as FixtureReturnType;
      await ybr.connect(multisig).delegate(multisig.address);
      expect(await ybr.getVotes(multisig.address)).to.equal(parseEther("1000000000"));
    });

    it("Votes disappear when transferred to non-delegated address", async function () {
      const { ybr, multisig, alice } = this.fixture as FixtureReturnType;
      await ybr.connect(multisig).transfer(alice.address, parseEther("100000000"));
      expect(await ybr.getVotes(multisig.address)).to.equal(parseEther("900000000"));
      expect(await ybr.getVotes(alice.address)).to.equal(0);
    });

    it("Votes reappear when transferred back to delegated address", async function () {
      const { ybr, multisig, alice } = this.fixture as FixtureReturnType;
      await ybr.connect(alice).transfer(multisig.address, parseEther("100000000"));
      expect(await ybr.getVotes(multisig.address)).to.equal(parseEther("1000000000"));
      expect(await ybr.getVotes(alice.address)).to.equal(0);
    });

    it("User delegates votes to multisig after transfer", async function () {
      const { ybr, multisig, bob } = this.fixture as FixtureReturnType;
      await ybr.connect(multisig).transfer(bob.address, parseEther("100000000"));
      expect(await ybr.getVotes(multisig.address)).to.equal(parseEther("900000000"));
      expect(await ybr.getVotes(bob.address)).to.equal(0);
      await ybr.connect(bob).delegate(multisig.address);
      expect(await ybr.getVotes(multisig.address)).to.equal(parseEther("1000000000"));
      expect(await ybr.getVotes(bob.address)).to.equal(0);
      expect(await ybr.balanceOf(bob.address)).to.equal(parseEther("100000000"));

      await ybr.connect(bob).transfer(multisig.address, parseEther("100000000"));
    });

    it("User delegates votes to multisig before transfer", async function () {
      const { ybr, multisig, bob } = this.fixture as FixtureReturnType;
      await ybr.connect(bob).delegate(multisig.address);
      await ybr.connect(multisig).transfer(bob.address, parseEther("100000000"));
      expect(await ybr.getVotes(multisig.address)).to.equal(parseEther("1000000000"));
      expect(await ybr.getVotes(bob.address)).to.equal(0);
      expect(await ybr.balanceOf(bob.address)).to.equal(parseEther("100000000"));

      await ybr.connect(bob).transfer(multisig.address, parseEther("100000000"));
    });
  });
});
