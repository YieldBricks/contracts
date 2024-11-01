import { loadFixture, reset, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { parseEther } from "ethers";
import { ethers, upgrades } from "hardhat";
import { vars } from "hardhat/config";

import { Escrow, Escrow__factory, MockUSDC__factory, MockYBR__factory } from "../types";

export async function deployEscrowFixture() {
  // Contracts are deployed using the first signer/account by default
  const [deployer, multisig, alice, bob, charlie] = await ethers.getSigners();

  //Deploy MockUSDC and MockYBR
  const MockUSDC = (await ethers.getContractFactory("MockUSDC")) as MockUSDC__factory;
  const usdt = await MockUSDC.deploy();
  const usdtAddress = await usdt.getAddress();

  const MockYBR = (await ethers.getContractFactory("MockYBR")) as MockYBR__factory;
  const ybr = await MockYBR.deploy();
  const ybrAddress = await ybr.getAddress();

  // Deploy YBR contract
  const Escrow = (await ethers.getContractFactory("Escrow")) as Escrow__factory;
  const EscrowProxy = await upgrades.deployProxy(
    Escrow,
    [multisig.address, await ybr.getAddress(), await usdt.getAddress()],
    {
      unsafeAllow: ["internal-function-storage"],
      initializer: "initialize",
    },
  );
  const escrow = Escrow.attach(await EscrowProxy.getAddress()) as Escrow;
  const escrowAddress = await escrow.getAddress();

  return {
    escrow,
    escrowAddress,
    usdt,
    usdtAddress,
    ybr,
    ybrAddress,
    deployer,
    multisig,
    alice,
    bob,
    charlie,
  };
}

type FixtureReturnType = Awaited<Promise<PromiseLike<ReturnType<typeof deployEscrowFixture>>>>;

describe("Escrow Test", function () {
  this.timeout(600000);

  before(async function () {
    // Fork arbitrum mainnet for test
    await reset(`https://arbitrum-mainnet.infura.io/v3/${vars.get("INFURA_API_KEY")}`);

    this.loadFixture = loadFixture;
  });

  describe("Happy flow", function () {
    before(async function () {
      this.fixture = (await this.loadFixture(deployEscrowFixture)) as FixtureReturnType;
    });

    it("The contract has the correct owner and token addresses", async function () {
      const { escrow, multisig, ybrAddress, usdtAddress } = this.fixture as FixtureReturnType;

      const owner = await escrow.owner();

      expect(owner).to.equal(multisig.address);
      expect(await escrow.ybr()).to.equal(ybrAddress);
      expect(await escrow.usdt()).to.equal(usdtAddress);
    });

    it("Transfer YBR to multisig and USDT to alice and bob", async function () {
      const { ybr, usdt, multisig, alice, bob, charlie } = this.fixture as FixtureReturnType;

      await usdt.transfer(alice.address, parseEther("10000"));
      await usdt.transfer(bob.address, parseEther("10000"));
      await usdt.transfer(charlie.address, parseEther("10000"));

      expect(await usdt.balanceOf(alice.address)).to.equal(parseEther("10000"));
      expect(await usdt.balanceOf(bob.address)).to.equal(parseEther("10000"));
      expect(await usdt.balanceOf(charlie.address)).to.equal(parseEther("10000"));

      await ybr.transfer(multisig.address, parseEther("10000"));

      expect(await ybr.balanceOf(multisig.address)).to.equal(parseEther("10000"));
    });

    it("Create a new liquidity escrow pool", async function () {
      const { escrow, escrowAddress, multisig, ybr } = this.fixture as FixtureReturnType;

      // Give allowance for the contract to spend YBR
      await ybr.connect(multisig).approve(escrowAddress, parseEther("100000"));

      // Create a new escrow pool
      const contributionStart = await time.latest();
      const contributionEnd = contributionStart + time.duration.days(30);
      const timeToMaturity = time.duration.days(60);
      const liquidityLimit = parseEther("1000");
      const collateral = parseEther("5000");
      const expectedYield = 500n;

      await escrow
        .connect(multisig)
        .createEscrowPool(
          contributionStart,
          contributionEnd,
          timeToMaturity,
          liquidityLimit,
          collateral,
          expectedYield,
        );

      const pool = await escrow.escrowPools(0);

      expect(pool).to.deep.equal([
        contributionStart,
        contributionEnd,
        timeToMaturity,
        liquidityLimit,
        collateral,
        expectedYield,
        false,
      ]);
    });

    it("Contribute to the escrow pool", async function () {
      const { escrow, escrowAddress, usdt, alice, bob, charlie } = this.fixture as FixtureReturnType;

      // Give allowance for the contract to spend USDT
      await usdt.connect(alice).approve(escrowAddress, parseEther("10000"));
      await usdt.connect(bob).approve(escrowAddress, parseEther("10000"));
      await usdt.connect(charlie).approve(escrowAddress, parseEther("10000"));

      // Contribute to the escrow pool
      await escrow.connect(alice).contribute(0, parseEther("100"));
      await escrow.connect(bob).contribute(0, parseEther("100"));

      expect(await escrow.userContributions(0, alice.address)).to.equal(parseEther("100"));
      expect(await escrow.userContributions(0, bob.address)).to.equal(parseEther("100"));
      expect(await escrow.poolContributions(0)).to.equal(parseEther("200"));
    });

    it("Can't contribute more than the remaining liquidity limit", async function () {
      const { escrow, alice } = this.fixture as FixtureReturnType;

      // Contribute to the escrow pool
      await escrow.connect(alice).contribute(0, parseEther("1000"));

      await expect(escrow.connect(alice).contribute(0, parseEther("100"))).to.be.revertedWith(
        "Escrow: Exceeds liquidity limit",
      );
    });

    it("Can't contribute after the contribution period ends", async function () {
      const { escrow, escrowAddress, usdt, alice } = this.fixture as FixtureReturnType;

      // Give allowance for the contract to spend USDT
      await usdt.connect(alice).approve(escrowAddress, parseEther("500"));

      // Contribute to the escrow pool
      await escrow.connect(alice).contribute(0, parseEther("100"));

      await time.increase(time.duration.days(31));

      await expect(escrow.connect(alice).contribute(0, parseEther("100"))).to.be.revertedWith(
        "Escrow: Contribution period ended",
      );
    });

    it("Can't withdraw before the maturity period ends", async function () {
      const { escrow, escrowAddress, usdt, alice } = this.fixture as FixtureReturnType;

      // Give allowance for the contract to spend USDT
      await usdt.connect(alice).approve(escrowAddress, parseEther("500"));

      // Contribute to the escrow pool
      await escrow.connect(alice).contribute(0, parseEther("100"));

      await expect(escrow.connect(alice).withdraw(0)).to.be.revertedWith("Escrow: Maturity period not ended");
    });

    it("Withdraw correct amounts if pool is cancelled", async function () {
      const { escrow, escrowAddress, usdt, alice, bob } = this.fixture as FixtureReturnType;

      // Give allowance for the contract to spend USDT
      await usdt.connect(alice).approve(escrowAddress, parseEther("500"));
      await usdt.connect(bob).approve(escrowAddress, parseEther("500"));

      // Contribute to the escrow pool
      await escrow.connect(alice).contribute(0, parseEther("100"));
      await escrow.connect(bob).contribute(0, parseEther("100"));

      await time.increase(time.duration.days(61));

      await escrow.connect(alice).withdraw(0);

      expect(await usdt.balanceOf(alice.address)).to.equal(parseEther("9900"));
      expect(await usdt.balanceOf(bob.address)).to.equal(parseEther("10000"));
    });

    it("Can't cancel pool after contribution period ends", async function () {
      const { escrow, escrowAddress, usdt, alice, bob } = this.fixture as FixtureReturnType;

      // Create new escrow pool
      const contributionStart = await time.latest();
      const contributionEnd = contributionStart + time.duration.days(30);
      const timeToMaturity = time.duration.days(60);
      const liquidityLimit = parseEther("1000");
      const collateral = parseEther("5000");
      const expectedYield = 500n;

      await escrow
        .connect(alice)
        .createEscrowPool(
          contributionStart,
          contributionEnd,
          timeToMaturity,
          liquidityLimit,
          collateral,
          expectedYield,
        );

      await time.increase(time.duration.days(31));

      await expect(escrow.connect(alice).cancelPool(1)).to.be.revertedWith("Escrow: Contribution period ended");
    });
  });
});
