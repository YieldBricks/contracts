import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, upgrades } from "hardhat";

import { Compliance, Compliance__factory, Token, Token__factory } from "../types";
import { identityTypedMessage } from "./utils";

export async function deployTokenFixture() {
  // Contracts are deployed using the first signer/account by default
  const [deployer, multisig, kycSigner, kycSigner2, alice, bob, charlie] = await ethers.getSigners();

  // Deploy Compliance contract
  const Compliance = (await ethers.getContractFactory("Compliance")) as Compliance__factory;
  const complianceProxy = await upgrades.deployProxy(Compliance, [kycSigner.address, multisig.address]);
  const compliance = Compliance.attach(await complianceProxy.getAddress()) as Compliance;
  const complianceAddress = await complianceProxy.getAddress();

  // Add Alice, Bob to Compliance
  const eip712Domain = await compliance.eip712Domain();
  const aliceIdentity = {
    wallet: alice.address,
    signer: kycSigner.address,
    emailHash: ethers.keccak256(ethers.toUtf8Bytes("alice@yieldbricks.com")),
    expiration: (await time.latest()) + 60 * 60 * 24 * 7, // 7 days
    country: 0,
  };

  const bobIdentity = {
    wallet: bob.address,
    signer: kycSigner.address,
    emailHash: ethers.keccak256(ethers.toUtf8Bytes("bob@yieldbricks.com")),
    expiration: (await time.latest()) + 60 * 60 * 24 * 7, // 7 days
    country: 0,
  };

  const charlieIdentity = {
    wallet: charlie.address,
    signer: kycSigner.address,
    emailHash: ethers.keccak256(ethers.toUtf8Bytes("charlie@yieldbricks.com")),
    expiration: (await time.latest()) + 60 * 60 * 24 * 7, // 7 days
    country: 0,
  };

  const aliceData = identityTypedMessage(eip712Domain, aliceIdentity);
  const bobData = identityTypedMessage(eip712Domain, bobIdentity);
  const charlieData = identityTypedMessage(eip712Domain, charlieIdentity);

  const aliceSignature = await kycSigner.signTypedData(aliceData.domain, aliceData.types, aliceData.identity);
  const bobSignature = await kycSigner.signTypedData(bobData.domain, bobData.types, bobData.identity);
  const charlieSignature = await kycSigner.signTypedData(charlieData.domain, charlieData.types, charlieData.identity);

  await compliance.addIdentity(aliceIdentity, aliceSignature);
  await compliance.addIdentity(bobIdentity, bobSignature);
  await compliance.addIdentity(charlieIdentity, charlieSignature);

  console.log("Compliance deployed to:", await compliance.getAddress());

  // Deploy Token contract
  const Token = (await ethers.getContractFactory("Token")) as Token__factory;
  const tokenProxy = await upgrades.deployProxy(Token, [complianceAddress, alice.address, "TestToken", "TT", 1000000]);
  const token = Token.attach(await tokenProxy.getAddress()) as Token;
  const tokenAddress = await token.getAddress();

  return {
    compliance,
    complianceAddress,
    token,
    tokenAddress,
    deployer,
    multisig,
    alice,
    bob,
    charlie,
    kycSigner,
    kycSigner2,
  };
}
