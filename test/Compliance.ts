import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { deploySystemFixture } from "./System.fixture";
import { identityTypedMessage } from "./utils";

describe("Compliance", function () {
  before(async function () {
    this.loadFixture = loadFixture;
  });

  describe("Flow", function () {
    before(async function () {
      this.fixture = await loadFixture(deploySystemFixture);
    });

    it("Compliance should have correct owner", async function () {
      const { compliance, multisig } = this.fixture;
      expect(await compliance.owner()).to.equal(multisig.address);
    });

    it("Identity signer can add new Identities", async function () {
      const { compliance, kycSigner, alice, bob } = this.fixture;

      const eip712Domain = await compliance.eip712Domain();

      const aliceIdentity = {
        wallet: alice.address,
        signer: kycSigner.address,
        emailHash: ethers.keccak256(ethers.toUtf8Bytes("alice@example.com")),
        expiration: (await time.latest()) + 60 * 60 * 24 * 7, // 7 days
        country: 840,
      };

      const bobIdentity = {
        wallet: bob.address,
        signer: kycSigner.address,
        emailHash: ethers.keccak256(ethers.toUtf8Bytes("bob@example.com")),
        expiration: (await time.latest()) + 60 * 60 * 24 * 7, // 7 days,
        country: 550,
      };

      const aliceData = identityTypedMessage(eip712Domain, aliceIdentity);
      const bobData = identityTypedMessage(eip712Domain, bobIdentity);

      const aliceSignature = await kycSigner.signTypedData(aliceData.domain, aliceData.types, aliceData.identity);

      const bobSignature = await kycSigner.signTypedData(bobData.domain, bobData.types, bobData.identity);

      await compliance.addIdentity(aliceIdentity, aliceSignature);
      await compliance.addIdentity(bobIdentity, bobSignature);
    });

    it("Alice and Bob can transfer, but Eve cannot", async function () {
      const { compliance, alice, bob, eve } = this.fixture;

      expect(compliance.canTransfer(alice, bob, 1));
      expect(compliance.canTransfer(bob, alice, 1));
      await expect(compliance.canTransfer(eve, alice, 1)).to.be.revertedWith("Sender identity not found");
    });

    it("Blacklist Alice's country", async function () {
      const { compliance, multisig, alice, bob } = this.fixture;

      await compliance.connect(multisig).blacklistCountry(840, true);
      await expect(compliance.canTransfer(alice, alice, 1)).to.be.revertedWith("Sender country is blacklisted");
      expect(compliance.canTransfer(bob, bob, 1));
    });

    it("Unblacklist Alice's country", async function () {
      const { compliance, multisig, alice } = this.fixture;

      await compliance.connect(multisig).blacklistCountry(840, false);
      expect(compliance.canTransfer(alice, alice, 1));
    });

    it("Blacklist Alice's wallet", async function () {
      const { compliance, multisig, alice, bob } = this.fixture;

      await compliance.connect(multisig).blacklistWallet(alice.address, true);
      await expect(compliance.canTransfer(alice, alice, 1)).to.be.revertedWith("Sender wallet is blacklisted");
      expect(compliance.canTransfer(bob, bob, 1));
    });

    it("Unblacklist Alice's wallet", async function () {
      const { compliance, multisig, alice } = this.fixture;

      await compliance.connect(multisig).blacklistWallet(alice.address, false);
      expect(compliance.canTransfer(alice, alice, 1));
    });

    it("Blacklist Signer", async function () {
      const { compliance, multisig, kycSigner, alice } = this.fixture;

      await compliance.connect(multisig).blacklistSigner(kycSigner, true);
      await expect(compliance.canTransfer(alice, alice, 1)).to.be.revertedWith("Sender signer is blacklisted");

      await compliance.connect(multisig).blacklistSigner(kycSigner.address, false);

      expect(compliance.canTransfer(alice, alice, 1));
    });

    it("Signer expiration", async function () {
      const { compliance, kycSigner, eve } = await loadFixture(deploySystemFixture);

      await time.increase(60 * 60 * 24 * 8); // Increase by 8 days

      // Try to add identity with blacklisted signer
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

      await expect(compliance.addIdentity(eveIdentity, eveSignature)).to.be.revertedWith("Expired signer key");
    });
  });
});
