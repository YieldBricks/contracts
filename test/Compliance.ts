import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { deploySystemFixture } from "./System.fixture";
import { DAY, identityTypedMessage } from "./utils";

describe("Compliance", function () {
  before(async function () {
    this.loadFixture = loadFixture;
  });

  describe("Happy Flow", function () {
    before(async function () {
      this.fixture = await loadFixture(deploySystemFixture);
    });

    it("The initialize function should only be called once", async function () {
      const { compliance, kycSigner, multisig } = this.fixture;

      // Call the initialize function the second time and expect it to revert with a custom error
      await expect(compliance.initialize(kycSigner, multisig)).to.be.revertedWithCustomError(
        compliance,
        "InvalidInitialization",
      );
    });

    it("Compliance should have correct owner", async function () {
      const { compliance, multisig } = this.fixture;
      expect(await compliance.owner()).to.equal(multisig.address);
    });

    it("Identity signer can add new Identities", async function () {
      const { compliance, kycSigner, alice, bob } = this.fixture;

      const eip712Domain = await compliance.eip712Domain();

      console.log("EIP domain", eip712Domain);

      const aliceIdentity = {
        wallet: alice.address,
        signer: kycSigner.address,
        emailHash: ethers.keccak256(ethers.toUtf8Bytes("alice@example.com")),
        expiration: (await time.latest()) + 7 * DAY, // 7 days
        country: 840,
      };

      const bobIdentity = {
        wallet: bob.address,
        signer: kycSigner.address,
        emailHash: ethers.keccak256(ethers.toUtf8Bytes("bob@example.com")),
        expiration: (await time.latest()) + 14 * DAY, // 7 days,
        country: 550,
      };

      const aliceData = identityTypedMessage(eip712Domain, aliceIdentity);
      const bobData = identityTypedMessage(eip712Domain, bobIdentity);

      const aliceSignature = await kycSigner.signTypedData(aliceData.domain, aliceData.types, aliceData.identity);

      const bobSignature = await kycSigner.signTypedData(bobData.domain, bobData.types, bobData.identity);

      await compliance.addIdentity(aliceIdentity, aliceSignature);
      await compliance.addIdentity(bobIdentity, bobSignature);
    });

    it("Only multisig can add Identities", async function () {
      const { compliance, multisig, alice, kycSigner } = this.fixture;

      await expect(compliance.connect(alice).setIdentitySigner(kycSigner)).to.be.reverted;
      await expect(compliance.connect(multisig).setIdentitySigner(kycSigner)).to.be.fulfilled;
    });

    it("Only multisig can blacklist Signers", async function () {
      const { compliance, multisig, alice, kycSigner } = this.fixture;

      await expect(compliance.connect(alice).blacklistSigner(kycSigner, true)).to.be.reverted;
      await expect(compliance.connect(multisig).blacklistSigner(kycSigner, true)).to.be.fulfilled;

      await compliance.connect(multisig).blacklistSigner(kycSigner, false);
    });

    it("Only multisig can blacklist countries", async function () {
      const { compliance, multisig, alice } = this.fixture;

      await expect(compliance.connect(alice).blacklistCountry(840, true)).to.be.reverted;
      await expect(compliance.connect(multisig).blacklistCountry(840, true)).to.be.fulfilled;

      await compliance.connect(multisig).blacklistCountry(840, false);
    });

    it("Only multisig can blacklist wallets", async function () {
      const { compliance, multisig, alice, bob } = this.fixture;

      await expect(compliance.connect(alice).blacklistWallet(bob.address, true)).to.be.reverted;
      await expect(compliance.connect(multisig).blacklistWallet(bob.address, true)).to.be.fulfilled;

      await compliance.connect(multisig).blacklistWallet(bob.address, false);
    });

    it("Alice and Bob can transfer, but Eve cannot", async function () {
      const { compliance, alice, bob, eve } = this.fixture;

      expect(compliance.canTransfer(alice, bob));
      expect(compliance.canTransfer(bob, alice));
      await expect(compliance.canTransfer(eve, alice)).to.be.revertedWithCustomError(compliance, "IdentityNotFound");
    });

    it("Blacklist Alice's country", async function () {
      const { compliance, multisig, alice, bob } = this.fixture;

      await compliance.connect(multisig).blacklistCountry(840, true);
      await expect(compliance.canTransfer(alice, alice)).to.be.revertedWithCustomError(
        compliance,
        "CountryBlacklisted",
      );
      expect(compliance.canTransfer(bob, bob));
    });

    it("Unblacklist Alice's country", async function () {
      const { compliance, multisig, alice } = this.fixture;

      await compliance.connect(multisig).blacklistCountry(840, false);
      expect(compliance.canTransfer(alice, alice));
    });

    it("Blacklist Bob's country", async function () {
      const { compliance, multisig, alice, bob } = this.fixture;

      await compliance.connect(multisig).blacklistCountry(550, true);
      await expect(compliance.canTransfer(alice, bob)).to.be.revertedWithCustomError(compliance, "CountryBlacklisted");
      expect(compliance.canTransfer(alice, alice));
    });

    it("Unblacklist Bob's country", async function () {
      const { compliance, multisig, bob } = this.fixture;

      await compliance.connect(multisig).blacklistCountry(550, false);
      expect(compliance.canTransfer(bob, bob));
    });

    it("Blacklist Alice's wallet", async function () {
      const { compliance, multisig, alice, bob } = this.fixture;

      await compliance.connect(multisig).blacklistWallet(alice.address, true);
      await expect(compliance.canTransfer(alice, alice)).to.be.revertedWithCustomError(compliance, "WalletBlacklisted");
      expect(compliance.canTransfer(bob, bob));
    });

    it("Unblacklist Alice's wallet", async function () {
      const { compliance, multisig, alice } = this.fixture;

      await compliance.connect(multisig).blacklistWallet(alice.address, false);
      expect(compliance.canTransfer(alice, alice));
    });

    it("Blacklist Bob's wallet", async function () {
      const { compliance, multisig, alice, bob } = this.fixture;

      await compliance.connect(multisig).blacklistWallet(bob.address, true);
      await expect(compliance.canTransfer(alice, bob)).to.be.revertedWithCustomError(compliance, "WalletBlacklisted");
      expect(compliance.canTransfer(alice, alice));
    });

    it("Unblacklist Bob's wallet", async function () {
      const { compliance, multisig, bob } = this.fixture;

      await compliance.connect(multisig).blacklistWallet(bob.address, false);
      expect(compliance.canTransfer(bob, bob));
    });

    it("Blacklist Sender Signer", async function () {
      const { compliance, multisig, kycSigner, alice } = this.fixture;

      await compliance.connect(multisig).blacklistSigner(kycSigner, true);
      await expect(compliance.canTransfer(alice, alice)).to.be.revertedWithCustomError(compliance, "SignerBlacklisted");

      await compliance.connect(multisig).blacklistSigner(kycSigner.address, false);

      expect(compliance.canTransfer(alice, alice));
    });

    it("Sender and Receiver KYC expiration", async function () {
      const { compliance, alice, bob } = this.fixture;

      await time.increase(7 * DAY); // Increase by 7 days

      await expect(compliance.canTransfer(alice, bob)).to.be.revertedWithCustomError(compliance, "KYCExpired");
      await expect(compliance.canTransfer(bob, alice)).to.be.revertedWithCustomError(compliance, "KYCExpired");
    });

    it("Signer expiration", async function () {
      const { compliance, kycSigner, eve } = await loadFixture(deploySystemFixture);

      await time.increase(200 * DAY); // Increase by 200 days

      // Try to add identity with expired signer
      const eip712Domain = await compliance.eip712Domain();
      const eveIdentity = {
        wallet: eve.address,
        signer: kycSigner.address,
        emailHash: ethers.keccak256(ethers.toUtf8Bytes("eve@example.com")),
        expiration: (await time.latest()) + 60 * 60 * 24 * 7, // 7 days
        country: 840,
      };

      const eveData = identityTypedMessage(eip712Domain, eveIdentity);

      const eveSignature = await kycSigner.signTypedData(eveData.domain, eveData.types, eveData.identity);

      await expect(compliance.addIdentity(eveIdentity, eveSignature)).to.be.revertedWithCustomError(
        compliance,
        "ExpiredSignerKey",
      );
    });
  });

  describe("Change Identity Signer", function () {
    before(async function () {
      this.fixture = await loadFixture(deploySystemFixture);
    });

    it("Compliance should have correct owner", async function () {
      const { compliance, multisig } = this.fixture;
      expect(await compliance.owner()).to.equal(multisig.address);
    });

    // Add Alice and Bob, but change the signer so alice is added with kycSigner and bob with kycSigner2

    it("Identity signer can add new Identities", async function () {
      const { compliance, multisig, kycSigner, kycSigner2, alice, bob } = this.fixture;

      const eip712Domain = await compliance.eip712Domain();

      const aliceIdentity = {
        wallet: alice.address,
        signer: kycSigner.address,
        emailHash: ethers.keccak256(ethers.toUtf8Bytes("alice@example.com")),
        expiration: (await time.latest()) + 7 * DAY, // 7 days
        country: 840,
      };

      const bobIdentity = {
        wallet: bob.address,
        signer: kycSigner2.address,
        emailHash: ethers.keccak256(ethers.toUtf8Bytes("bob@example.com")),
        expiration: (await time.latest()) + 14 * DAY, // 7 days,
        country: 550,
      };

      const aliceData = identityTypedMessage(eip712Domain, aliceIdentity);
      const bobData = identityTypedMessage(eip712Domain, bobIdentity);

      const aliceSignature = await kycSigner.signTypedData(aliceData.domain, aliceData.types, aliceData.identity);

      const bobSignature = await kycSigner2.signTypedData(bobData.domain, bobData.types, bobData.identity);

      // await compliance.addIdentity(aliceIdentity, aliceSignature);
      // await compliance.addIdentity(bobIdentity, bobSignature);

      await expect(compliance.addIdentity(aliceIdentity, aliceSignature)).to.be.fulfilled;
      await expect(compliance.connect(multisig).setIdentitySigner(kycSigner2.address)).to.be.fulfilled;

      await expect(compliance.addIdentity(bobIdentity, bobSignature)).to.be.fulfilled;

      await expect(compliance.addIdentity(aliceIdentity, bobSignature)).to.be.revertedWithCustomError(
        compliance,
        "InvalidSignature",
      );

      const badSignature = await kycSigner2.signTypedData(aliceData.domain, aliceData.types, aliceData.identity);
      await expect(compliance.addIdentity(aliceIdentity, badSignature)).to.be.revertedWithCustomError(
        compliance,
        "SignatureMismatch",
      );
    });

    it("Make sure _identitySigner == signer", async function () {
      const { compliance, alice, bob, kycSigner, kycSigner2 } = this.fixture;

      const eip712Domain = await compliance.eip712Domain();

      const aliceIdentity = {
        wallet: alice.address,
        signer: kycSigner.address,
        emailHash: ethers.keccak256(ethers.toUtf8Bytes("alice@example.com")),
        expiration: (await time.latest()) + 7 * DAY, // 7 days
        country: 840,
      };

      const bobIdentity = {
        wallet: bob.address,
        signer: kycSigner2.address,
        emailHash: ethers.keccak256(ethers.toUtf8Bytes("bob@example.com")),
        expiration: (await time.latest()) + 14 * DAY, // 7 days,
        country: 550,
      };

      const bobData = identityTypedMessage(eip712Domain, bobIdentity);

      const bobSignature = await kycSigner2.signTypedData(bobData.domain, bobData.types, bobData.identity);

      await expect(compliance.addIdentity(aliceIdentity, bobSignature)).to.be.revertedWithCustomError(
        compliance,
        "InvalidSignature",
      );
    });

    it("Make sure _identitySigner == signer == _identitySigner", async function () {
      const { compliance, alice, kycSigner, kycSigner2 } = this.fixture;

      const eip712Domain = await compliance.eip712Domain();

      const aliceIdentity = {
        wallet: alice.address,
        signer: kycSigner.address,
        emailHash: ethers.keccak256(ethers.toUtf8Bytes("alice@example.com")),
        expiration: (await time.latest()) + 7 * DAY, // 7 days
        country: 840,
      };

      const aliceData = identityTypedMessage(eip712Domain, aliceIdentity);

      const badSignature = await kycSigner2.signTypedData(aliceData.domain, aliceData.types, aliceData.identity);
      await expect(compliance.addIdentity(aliceIdentity, badSignature)).to.be.revertedWithCustomError(
        compliance,
        "SignatureMismatch",
      );
    });

    it("Blacklist Alice's signer but not Bob's, then check canTransfer from Bob to Alice", async function () {
      const { compliance, multisig, kycSigner, alice, bob } = this.fixture;

      // Blacklist Alice's Signer
      await compliance.connect(multisig).blacklistSigner(kycSigner, true);

      // Check if Bob can transfer to Alice
      await expect(compliance.canTransfer(bob.address, alice.address)).to.be.revertedWithCustomError(
        compliance,
        "SignerBlacklisted",
      );

      // Unblacklist Alice
      await compliance.connect(multisig).blacklistSigner(kycSigner, false);

      // Check again if Bob can transfer to Alice
      // This call should not be reverted because Alice's signer is not blacklisted anymore
      await expect(compliance.canTransfer(bob.address, alice.address)).to.not.be.reverted;
    });
  });
});
