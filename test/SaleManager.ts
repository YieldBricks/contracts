import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { parseEther } from "ethers";
import { ethers } from "hardhat";

import { deploySaleManagerFixture } from "./SaleManager.fixture";
import { DAY, identityTypedMessage } from "./utils";

type FixtureReturnType = Awaited<Promise<PromiseLike<ReturnType<typeof deploySaleManagerFixture>>>>;

describe("SaleManager", function () {
  before(async function () {
    this.loadFixture = loadFixture;
  });

  describe("Happy flow", function () {
    before(async function () {
      this.fixture = (await this.loadFixture(deploySaleManagerFixture)) as FixtureReturnType;
    });

    it("SaleManager should have correct owner", async function () {
      const { saleManager, multisig } = this.fixture as FixtureReturnType;
      expect(await saleManager.owner()).to.equal(multisig.address);
    });

    it("SaleManager should have correct tokenBeacon", async function () {
      const { saleManager, propertyBeaconAddress: tokenBeaconAddress } = this.fixture as FixtureReturnType;
      expect(await saleManager.tokenBeacon()).to.equal(tokenBeaconAddress);
    });

    it("Distribute YBR tokens to alice and bob", async function () {
      const { ybr, multisig, alice, bob } = this.fixture as FixtureReturnType;

      await ybr.connect(multisig).transfer(alice.address, parseEther("1000"));
      await ybr.connect(multisig).transfer(bob.address, parseEther("1000"));

      expect(await ybr.balanceOf(alice.address)).to.equal(parseEther("1000"));
      expect(await ybr.balanceOf(bob.address)).to.equal(parseEther("1000"));
    });

    it("Whitelist YBR token", async function () {
      const { multisig, saleManager, ybrAddress } = this.fixture as FixtureReturnType;

      await saleManager.connect(multisig).whitelistPaymentToken(ybrAddress, true);

      expect(await saleManager.whitelistedPaymentTokens(ybrAddress)).to.be.true;
    });

    it("Oracle should be able to set and return price", async function () {
      const { mockOracle, ybrAddress } = this.fixture as FixtureReturnType;

      const price = 100;
      await mockOracle.setPrice(price);
      expect(await mockOracle.getTokenUSDPrice(ybrAddress)).to.deep.equal([BigInt(price), 1n, 18n]);
    });

    it("Create property and verify that the entire supply is on the SaleManager", async function () {
      const { saleManager, compliance, saleManagerAddress, multisig } = this.fixture as FixtureReturnType;

      const name = "TestToken";
      const symbol = "TT";
      const cap = parseEther("1000");

      expect(await compliance.canTransfer(saleManagerAddress, saleManagerAddress));

      await expect(saleManager.createToken(name, symbol, cap)).to.be.revertedWithCustomError(
        saleManager,
        "OwnableUnauthorizedAccount",
      );

      await expect(saleManager.connect(multisig).createToken(name, symbol, cap)).to.emit(saleManager, "TokenDeployed");
      const propertyAddress = await saleManager.tokenAddresses(0);

      const property = await ethers.getContractAt("Property", propertyAddress);
      expect(await property.balanceOf(saleManagerAddress)).to.equal(cap);
    });

    it("Create sale for property", async function () {
      const { saleManager, multisig } = this.fixture as FixtureReturnType;

      const propertyAddress = await saleManager.tokenAddresses(0);

      const startTime = (await time.latest()) + DAY;
      const endTime = (await time.latest()) + 7 * DAY;
      const price = 100; // Price in USD

      await expect(saleManager.connect(multisig).createSale(propertyAddress, startTime, endTime, price)).to.emit(
        saleManager,
        "SaleCreated",
      );

      const sale = await saleManager.sales(propertyAddress);
      expect(sale.start).to.equal(startTime);
      expect(sale.end).to.equal(endTime);
      expect(sale.price).to.equal(price);
    });

    it("User can't buy property before sale starts", async function () {
      const { saleManager, saleManagerAddress, alice, ybr, ybrAddress } = this.fixture as FixtureReturnType;

      const propertyAddress = await saleManager.tokenAddresses(0);

      // Give approval for price * ybrPerUSD
      await ybr.connect(alice).approve(saleManagerAddress, 100);

      await expect(saleManager.connect(alice).buyTokens(1, ybrAddress, propertyAddress)).to.be.revertedWithCustomError(
        saleManager,
        "SaleNotStarted",
      );
    });

    it("Non-KYCed user can start to buy property during sale duration", async function () {
      const { saleManager, saleManagerAddress, alice, ybr, ybrAddress } = this.fixture as FixtureReturnType;

      await time.increase(DAY);

      const propertyAddress = await saleManager.tokenAddresses(0);

      // Give approval for price * tokensPerUSD
      await ybr.connect(alice).approve(saleManagerAddress, parseEther("100"));

      await saleManager.connect(alice).buyTokens(1, ybrAddress, propertyAddress);

      // await expect(saleManager.connect(alice).buyTokens(1, ybrAddress, propertyAddress))
      //   .to.be.revertedWithCustomError(compliance, "IdentityNotFound")
      //   .withArgs(alice.address);

      const [propertyAddress_, paymentTokenAddress, propertyAmount, paymentTokenAmount] =
        await saleManager.unclaimedByUser(alice.address, 0);

      expect(propertyAddress_).to.equal(propertyAddress);
      expect(paymentTokenAddress).to.equal(ybrAddress);
      expect(propertyAmount).to.equal(1);
      expect(paymentTokenAmount).to.equal(parseEther("10"));

      const unclaimedProperties = await saleManager.unclaimedProperties(propertyAddress);

      expect(unclaimedProperties).to.equal(1);
    });

    it("User tries to claim property before KYC", async function () {
      const { saleManager, alice, compliance } = this.fixture as FixtureReturnType;

      await expect(saleManager.connect(alice).claimTokens())
        .to.be.revertedWithCustomError(compliance, "IdentityNotFound")
        .withArgs(alice.address);
    });

    it("User tries to claim when there are no unclaimed properties", async function () {
      const { saleManager, bob } = this.fixture as FixtureReturnType;

      await expect(saleManager.connect(bob).claimTokens()).to.be.revertedWithCustomError(
        saleManager,
        "NoUnclaimedTokens",
      );
    });

    it("Add KYC data for user", async function () {
      const { alice, kycSigner, compliance } = this.fixture as FixtureReturnType;

      const eip712Domain = await compliance.eip712Domain();
      const aliceIdentity = {
        wallet: alice.address,
        signer: kycSigner.address,
        emailHash: ethers.keccak256(ethers.toUtf8Bytes("alice@yieldbricks.com")),
        expiration: (await time.latest()) + 60 * 60 * 24 * 7, // 7 days
        country: 0,
      };

      const aliceData = identityTypedMessage(eip712Domain, aliceIdentity);

      const aliceSignature = await kycSigner.signTypedData(aliceData.domain, aliceData.types, aliceData.identity);

      await compliance.addIdentity(aliceIdentity, aliceSignature);
    });

    it("User can claim property after KYC", async function () {
      const { saleManager, alice } = this.fixture as FixtureReturnType;

      const propertyAddress = await saleManager.tokenAddresses(0);

      // Check property balance
      const property = await ethers.getContractAt("Property", propertyAddress);
      expect(await property.balanceOf(alice.address)).to.equal(parseEther("0"));

      await saleManager.connect(alice).claimTokens();

      // Check property balance
      expect(await property.balanceOf(alice.address)).to.equal(parseEther("1"));

      const unclaimedProperties = await saleManager.unclaimedProperties(alice.address);

      expect(unclaimedProperties).to.equal(0);

      await expect(saleManager.connect(alice).claimTokens()).to.be.revertedWithCustomError(
        saleManager,
        "NoUnclaimedTokens",
      );
    });

    it("User can get partial refund if not passing KYC", async function () {
      const { saleManager, saleManagerAddress, bob, ybr, ybrAddress, compliance } = this.fixture as FixtureReturnType;

      const propertyAddress = await saleManager.tokenAddresses(0);

      // Give approval for price * ybrPerUSD
      await ybr.connect(bob).approve(saleManagerAddress, parseEther("100"));

      // Check property balance
      const property = await ethers.getContractAt("Property", propertyAddress);
      expect(await property.balanceOf(bob.address)).to.equal(parseEther("0"));

      await saleManager.connect(bob).buyTokens(1, ybrAddress, propertyAddress);

      // Check property balance
      expect(await property.balanceOf(bob.address)).to.equal(parseEther("0"));

      await expect(saleManager.connect(bob).claimTokens()).to.be.revertedWithCustomError(
        compliance,
        "IdentityNotFound",
      );

      await saleManager.connect(bob).cancelPurchases();

      await expect(saleManager.connect(bob).cancelPurchases()).to.be.revertedWithCustomError(
        saleManager,
        "NoUnclaimedTokens",
      );
    });

    it("Set Oracle address", async function () {
      const { saleManager, mockOracleAddress, multisig } = this.fixture as FixtureReturnType;

      await expect(saleManager.connect(multisig).setOracle(mockOracleAddress));

      expect(await saleManager.oracle()).to.equal(mockOracleAddress);
    });

    it("Edit sale for property", async function () {
      const { saleManager, multisig } = this.fixture as FixtureReturnType;

      const propertyAddress = await saleManager.tokenAddresses(0);

      const startTime = (await time.latest()) - DAY;
      const endTime = (await time.latest()) + 7 * DAY;
      const price = 200; // Price in USD

      await expect(saleManager.connect(multisig).editSale(propertyAddress, startTime, endTime, price)).to.emit(
        saleManager,
        "SaleModified",
      );

      const sale = await saleManager.sales(propertyAddress);
      expect(sale.start).to.equal(startTime);
      expect(sale.end).to.equal(endTime);
      expect(sale.price).to.equal(price);
    });

    it("KYCed user purchase succeeds without issues", async function () {
      const { saleManager, saleManagerAddress, alice, ybr, ybrAddress } = this.fixture as FixtureReturnType;

      const propertyAddress = await saleManager.tokenAddresses(0);

      await ybr.connect(alice).approve(saleManagerAddress, parseEther("100"));

      // Check property balance
      const property = await ethers.getContractAt("Property", propertyAddress);
      expect(await property.balanceOf(alice.address)).to.equal(parseEther("1"));

      await saleManager.connect(alice).buyTokens(1, ybrAddress, propertyAddress);

      // Check unclaimed properties is 0
      const unclaimedProperties = await saleManager.unclaimedProperties(alice.address);

      expect(unclaimedProperties).to.equal(0);

      // Check property balance

      expect(await property.balanceOf(alice.address)).to.equal(parseEther("2"));
    });

    it("User can't buy property when contract is paused", async function () {
      const { saleManager, multisig, alice, ybrAddress } = this.fixture as FixtureReturnType;

      await saleManager.connect(multisig).setPaused(true);

      const propertyAddress = await saleManager.tokenAddresses(0);

      await expect(saleManager.connect(alice).buyTokens(1, ybrAddress, propertyAddress)).to.be.revertedWithCustomError(
        saleManager,
        "EnforcedPause",
      );

      await saleManager.connect(multisig).setPaused(false);
    });

    it("Single price calculation with price set to ETH range on mockOracle", async function () {
      const { saleManager, mockOracle, ybrAddress } = this.fixture as FixtureReturnType;

      // Scenario: 1 property costs 200 USD, 1 YBR = 2500 USD. YBR has 18 decimlals,
      // the priceFeed has 1 decimal - meaning to mean 2500 USD it needs to return 25_000

      await mockOracle.setPrice(25_000n);

      // Based on that, the total cost for 1 property should be 0.08 YBR

      const expectedTotalTokenCost = parseEther("0.08");

      const propertyAddress = await saleManager.tokenAddresses(0);

      const totalTokenCost = await saleManager.calculatePurchasePrice(1n, ybrAddress, propertyAddress);

      expect(totalTokenCost).to.equal(expectedTotalTokenCost);
    });

    it("Single price calculation with price set to BTC range on mockOracle", async function () {
      const { saleManager, mockOracle, ybrAddress } = this.fixture as FixtureReturnType;

      // Scenario: 1 property costs 200 USD, 1 YBR = 60000 USD. YBR has 18 decimals,
      // the priceFeed has 1 decimal - meaning to mean 60000 USD it needs to return 600_000

      await mockOracle.setPrice(600_000n);

      // Based on that, the total cost for 30 property should be 0.1 YBR

      const expectedTotalTokenCost = parseEther("0.1");

      const propertyAddress = await saleManager.tokenAddresses(0);

      const totalTokenCost = await saleManager.calculatePurchasePrice(30n, ybrAddress, propertyAddress);

      expect(totalTokenCost).to.equal(expectedTotalTokenCost);
    });

    it("Single price calculation with price set to USDC range on mockOracle", async function () {
      const { saleManager, mockOracle, ybrAddress } = this.fixture as FixtureReturnType;

      // Scenario: 1 property costs 200 USD, 1 YBR = 1 USD. YBR has 18 decimals,
      // the priceFeed has 1 decimal - meaning to mean 1 USD it needs to return 10

      await mockOracle.setPrice(10n);

      // Based on that, the total cost for 1 property should be 200 YBR

      const expectedTotalTokenCost = parseEther("200");

      const propertyAddress = await saleManager.tokenAddresses(0);

      const totalTokenCost = await saleManager.calculatePurchasePrice(1n, ybrAddress, propertyAddress);

      expect(totalTokenCost).to.equal(expectedTotalTokenCost);
    });

    it("Single price calculation with price set to YBR range on mockOracle", async function () {
      const { saleManager, mockOracle, ybrAddress } = this.fixture as FixtureReturnType;

      // Scenario: 1 property costs 200 USD, 1 YBR = 0.1 USD. YBR has 18 decimals,
      // the priceFeed has 1 decimal - meaning to mean 0.1 USD it needs to return 1

      await mockOracle.setPrice(1n);

      // Based on that, the total cost for 1 property should be 2000 YBR

      const expectedTotalTokenCost = parseEther("2000");

      const propertyAddress = await saleManager.tokenAddresses(0);

      const totalTokenCost = await saleManager.calculatePurchasePrice(1n, ybrAddress, propertyAddress);

      expect(totalTokenCost).to.equal(expectedTotalTokenCost);
    });

    it("Fuzz price calculation with various prices set on mockOracle", async function () {
      const { saleManager, mockOracle, ybrAddress } = this.fixture as FixtureReturnType;

      const propertyAddress = await saleManager.tokenAddresses(0);
      const paymentTokenAddress = ybrAddress; // Assuming ybrAddress is the payment token address
      const amount = 1n; // Example amount, adjust as needed

      const tokenPrices = [
        1n,
        10n,
        100n,
        1_000n,
        10_000n,
        20_0000n,
        50_000n,
        100_000n,
        2n,
        3n,
        4n,
        5n,
        6n,
        7n,
        8n,
        9n,
        10n,
        11n,
        12n,
      ];

      const propertyUsdPrice = (await saleManager.sales(propertyAddress)).price;

      for (const tokenPrice of tokenPrices) {
        // Sets price of the paymentToken in USD (1 decimal)
        await mockOracle.setPrice(tokenPrice);

        const totalTokenCost = await saleManager.calculatePurchasePrice(amount, paymentTokenAddress, propertyAddress);

        // Calculate the expected price based on the mockOracle price and the property cost
        // 10 ** 19 is 10 ** (priceDecimals + tokenDecimals) for the token price feed
        const expectedTotalTokenCost = (propertyUsdPrice * amount * 10n ** 19n) / tokenPrice;

        expect(totalTokenCost).to.equal(expectedTotalTokenCost);
      }
    });

    it("Owner should be able to withdraw funds", async function () {
      const { saleManager, saleManagerAddress, ybr, ybrAddress, multisig } = this.fixture as FixtureReturnType;

      // Check YBR balance of sale manager and multisig before and after withdraw

      const saleManagerBalanceBefore = await ybr.balanceOf(saleManagerAddress);
      const multisigBalanceBefore = await ybr.balanceOf(multisig.address);

      await saleManager.connect(multisig).withdrawFunds(ybrAddress);

      const saleManagerBalanceAfter = await ybr.balanceOf(saleManagerAddress);
      const multisigBalanceAfter = await ybr.balanceOf(multisig.address);

      expect(saleManagerBalanceAfter).to.equal(0);
      expect(multisigBalanceAfter).to.equal(saleManagerBalanceBefore + multisigBalanceBefore);
    });

    it("User can't buy property after sale ends", async function () {
      const { saleManager, alice, ybrAddress } = this.fixture as FixtureReturnType;

      await time.increase(7 * DAY);

      const propertyAddress = await saleManager.tokenAddresses(0);

      await expect(saleManager.connect(alice).buyTokens(1, ybrAddress, propertyAddress)).to.be.revertedWithCustomError(
        saleManager,
        "SaleEnded",
      );
    });
  });

  describe("Higher Tier Pre-Sale", function () {
    before(async function () {
      this.fixture = (await this.loadFixture(deploySaleManagerFixture)) as FixtureReturnType;
    });

    it("Distribute YBR tokens to alice and bob", async function () {
      const { ybr, multisig, alice, bob } = this.fixture as FixtureReturnType;

      await ybr.connect(multisig).transfer(alice.address, parseEther("10000"));
      await ybr.connect(multisig).transfer(bob.address, parseEther("10000"));

      expect(await ybr.balanceOf(alice.address)).to.equal(parseEther("10000"));
      expect(await ybr.balanceOf(bob.address)).to.equal(parseEther("10000"));
    });

    it("Give Alice the TYCOON tier", async function () {
      const { tiers, alice, multisig } = this.fixture as FixtureReturnType;

      await tiers.connect(multisig).setTierOverride(alice.address, 5); // 5 is GURU

      const tier = await tiers.getTier(alice.address);

      expect(await tiers.getTierBenefits(tier)).to.deep.equal([5n, 259200n, 4000n, 1000]);
    });

    it("Whitelist YBR token", async function () {
      const { multisig, saleManager, ybrAddress } = this.fixture as FixtureReturnType;

      await saleManager.connect(multisig).whitelistPaymentToken(ybrAddress, true);

      expect(await saleManager.whitelistedPaymentTokens(ybrAddress)).to.be.true;
    });

    it("Oracle should be able to set and return price", async function () {
      const { mockOracle, ybrAddress } = this.fixture as FixtureReturnType;

      const price = 100;
      await mockOracle.setPrice(price);
      expect(await mockOracle.getTokenUSDPrice(ybrAddress)).to.deep.equal([BigInt(price), 1n, 18n]);
    });

    it("Create property and verify that the entire supply is on the SaleManager", async function () {
      const { saleManager, compliance, saleManagerAddress, multisig } = this.fixture as FixtureReturnType;

      const name = "TestToken";
      const symbol = "TT";
      const cap = parseEther("1000");

      expect(await compliance.canTransfer(saleManagerAddress, saleManagerAddress));

      await expect(saleManager.createToken(name, symbol, cap)).to.be.revertedWithCustomError(
        saleManager,
        "OwnableUnauthorizedAccount",
      );

      await expect(saleManager.connect(multisig).createToken(name, symbol, cap)).to.emit(saleManager, "TokenDeployed");
      const propertyAddress = await saleManager.tokenAddresses(0);

      const property = await ethers.getContractAt("Property", propertyAddress);
      expect(await property.balanceOf(saleManagerAddress)).to.equal(cap);
    });

    it("Create sale for property", async function () {
      const { saleManager, multisig } = this.fixture as FixtureReturnType;

      const propertyAddress = await saleManager.tokenAddresses(0);

      const startTime = (await time.latest()) + DAY;
      const endTime = (await time.latest()) + 7 * DAY;
      const price = 100; // Price in USD

      await expect(saleManager.connect(multisig).createSale(propertyAddress, startTime, endTime, price)).to.emit(
        saleManager,
        "SaleCreated",
      );

      const sale = await saleManager.sales(propertyAddress);
      expect(sale.start).to.equal(startTime);
      expect(sale.end).to.equal(endTime);
      expect(sale.price).to.equal(price);
    });

    it("User can't buy more tokens than tier limit during pre-sale", async function () {
      const { saleManager, saleManagerAddress, alice, ybr, ybrAddress } = this.fixture as FixtureReturnType;

      const propertyAddress = await saleManager.tokenAddresses(0);

      await ybr.connect(alice).approve(saleManagerAddress, parseEther("5000"));

      await expect(
        saleManager.connect(alice).buyTokens(200, ybrAddress, propertyAddress),
      ).to.be.revertedWithCustomError(saleManager, "TierWalletLimitReached");
    });

    it("User can buy tokens up to tier limit during pre-sale", async function () {
      const { saleManager, saleManagerAddress, alice, ybr, ybrAddress } = this.fixture as FixtureReturnType;

      const propertyAddress = await saleManager.tokenAddresses(0);

      await ybr.connect(alice).approve(saleManagerAddress, parseEther("10000"));

      await saleManager.connect(alice).buyTokens(80, ybrAddress, propertyAddress);

      const [propertyAddress_, paymentTokenAddress, propertyAmount, paymentTokenAmount] =
        await saleManager.unclaimedByUser(alice.address, 0);

      expect(propertyAddress_).to.equal(propertyAddress);
      expect(paymentTokenAddress).to.equal(ybrAddress);
      expect(propertyAmount).to.equal(80);
      expect(paymentTokenAmount).to.equal(parseEther("800"));

      expect(await saleManager.purchasesPerPropertyPerUser(propertyAddress, alice.address)).to.equal(80);
      expect(await saleManager.purchasesPerPropertyPerTier(propertyAddress, 5)).to.equal(80);
    });

    it("Sale fails if user tries to buy more once the limit is reached", async function () {
      const { saleManager, saleManagerAddress, alice, ybr, ybrAddress } = this.fixture as FixtureReturnType;

      const propertyAddress = await saleManager.tokenAddresses(0);

      await ybr.connect(alice).approve(saleManagerAddress, parseEther("1100"));

      await expect(saleManager.connect(alice).buyTokens(1, ybrAddress, propertyAddress)).to.be.revertedWithCustomError(
        saleManager,
        "TierWalletLimitReached",
      );
    });

    it("Tier wallet limit remains even when sale begins", async function () {
      const { saleManager, saleManagerAddress, alice, ybr, ybrAddress } = this.fixture as FixtureReturnType;

      await time.increase(DAY);

      const propertyAddress = await saleManager.tokenAddresses(0);

      await ybr.connect(alice).approve(saleManagerAddress, parseEther("1100"));

      await expect(saleManager.connect(alice).buyTokens(1, ybrAddress, propertyAddress)).to.be.revertedWithCustomError(
        saleManager,
        "TierWalletLimitReached",
      );

      // const [propertyAddress_, paymentTokenAddress, propertyAmount, paymentTokenAmount] =
      //   await saleManager.unclaimedByUser(alice.address, 1);

      // expect(propertyAddress_).to.equal(propertyAddress);
      // expect(paymentTokenAddress).to.equal(ybrAddress);
      // expect(propertyAmount).to.equal(1);
      // expect(paymentTokenAmount).to.equal(parseEther("10"));

      // const unclaimedProperties = await saleManager.unclaimedProperties(propertyAddress);

      // expect(unclaimedProperties).to.equal(101);
    });
  });

  describe("Pausability tests", function () {
    before(async function () {
      this.fixture = (await this.loadFixture(deploySaleManagerFixture)) as FixtureReturnType;
    });

    it("Only owner can pause contract", async function () {
      const { saleManager, multisig, alice } = this.fixture as FixtureReturnType;

      await expect(saleManager.connect(alice).setPaused(true)).to.be.revertedWithCustomError(
        saleManager,
        "OwnableUnauthorizedAccount",
      );

      await saleManager.connect(multisig).setPaused(true);
    });
  });
});
