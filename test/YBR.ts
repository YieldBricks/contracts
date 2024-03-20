import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import { deployYBRFixture } from "./YBR.fixture";

type FixtureReturnType = Awaited<Promise<PromiseLike<ReturnType<typeof deployYBRFixture>>>>;

// User stories for tests

/*

Basic Usage Flow

1. Multisig should have all the tokens initially
2. Multisig should be able to distribute tokens to alice and bob
3. Alice and bob should have the correct amount of tokens

4. Multisig should be able to pause the contract
 - Alice and bob should not be able to transfer tokens

5. Multisig should be able to unpause the contract
  - Alice and bob should be able to transfer tokens

6. Multisig should be able to freeze any wallet (alice) by calling freezeWallet
  - Alice should not be able to transfer tokens
  - Bob should be able to transfer tokens

7. Multisig should be able to unfreeze any wallet (alice) by calling unfreezeWallet
  - Alice should be able to transfer tokens
  - Bob should be able to transfer tokens

8. Token holder (alice) should be able to transfer tokens to any other wallet (bob)
  - Alice should be able to transfer tokens
  - Bob should have the correct amount of tokens

9. Token holder (alice) should be able to give permission (allowance) to any other wallet (charlie) to spend her tokens
  - Charlie should be able to spend alice's tokens
  - Charlie shouldn't be able to spend bob's tokens

10. Token holder (alice) should be able to revoke permission (allowance) to any other wallet (charlie) to spend her tokens
  - Charlie shouldn't be able to spend alice's tokens
  - Charlie shouldn't be able to spend bob's tokens

11. Token holder (alice) should be able to give permission using ERC20Permit extension
  - Charlie should be able to spend alice's tokens
  - Charlie shouldn't be able to spend bob's tokens

12. Token holder (alice) should be able to revoke permission using ERC20Permit extension
  - Charlie shouldn't be able to spend alice's tokens
  - Charlie shouldn't be able to spend bob's tokens

14. Token supply should be correct

Votes tests

1. Multisig should have all the tokens initially
2. Multisig should be able to distribute tokens to alice and bob

3. Check voting power at current block of alice and bob (should be 0)
4. Alice delegates voting power to herself
5. Check voting power at current block of alice (should be non-zero), bob should still be zero
6. Alice transfers tokens to bob, alice and bob should again have voting power zero
7. What happens when bob transfers back to alice etc?




*/

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
      expect(await ybr.balanceOf(multisig.address)).to.equal(1_000_000_000);
    });

    it("Multisig should have no votes prior to delegating", async function () {
      const { ybr, multisig } = this.fixture as FixtureReturnType;
      expect(await ybr.getVotes(multisig.address)).to.equal(0);
    });

    it("Multisig should be able to delegate votes to itself", async function () {
      const { ybr, multisig } = this.fixture as FixtureReturnType;
      await ybr.connect(multisig).delegate(multisig.address);
      expect(await ybr.getVotes(multisig.address)).to.equal(1_000_000_000);
    });

    it("Votes disappear when transfered to non-delegated address", async function () {
      const { ybr, multisig, alice } = this.fixture as FixtureReturnType;
      await ybr.connect(multisig).transfer(alice.address, 100_000_000);
      expect(await ybr.getVotes(multisig.address)).to.equal(900_000_000);
      expect(await ybr.getVotes(alice.address)).to.equal(0);
    });

    it("Votes reappear when transferred back to delegated address", async function () {
      const { ybr, multisig, alice } = this.fixture as FixtureReturnType;
      await ybr.connect(alice).transfer(multisig.address, 100_000_000);
      expect(await ybr.getVotes(multisig.address)).to.equal(1_000_000_000);
      expect(await ybr.getVotes(alice.address)).to.equal(0);
    });

    it("User delegates votes to multisig after transfer", async function () {
      const { ybr, multisig, bob } = this.fixture as FixtureReturnType;
      await ybr.connect(multisig).transfer(bob.address, 100_000_000);
      expect(await ybr.getVotes(multisig.address)).to.equal(900_000_000);
      expect(await ybr.getVotes(bob.address)).to.equal(0);
      await ybr.connect(bob).delegate(multisig.address);
      expect(await ybr.getVotes(multisig.address)).to.equal(1_000_000_000);
      expect(await ybr.getVotes(bob.address)).to.equal(0);
      expect(await ybr.balanceOf(bob.address)).to.equal(100_000_000);

      await ybr.connect(bob).transfer(multisig.address, 100_000_000);
    });

    it("User delegates votes to multisig before transfer", async function () {
      const { ybr, multisig, bob } = this.fixture as FixtureReturnType;
      await ybr.connect(bob).delegate(multisig.address);
      await ybr.connect(multisig).transfer(bob.address, 100_000_000);
      expect(await ybr.getVotes(multisig.address)).to.equal(1_000_000_000);
      expect(await ybr.getVotes(bob.address)).to.equal(0);
      expect(await ybr.balanceOf(bob.address)).to.equal(100_000_000);

      await ybr.connect(bob).transfer(multisig.address, 100_000_000);
    });
  });
});
