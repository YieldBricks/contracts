import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, upgrades } from "hardhat";

import {
  Compliance,
  Compliance__factory,
  EthYBR,
  EthYBR__factory,
  Property,
  Property__factory,
  TiersV1 as Tiers,
  TiersV1__factory as Tiers__factory,
} from "../types";
import { ZERO_ADDRESS, identityTypedMessage } from "./utils";

export async function deployPropertyFixture() {
  // Contracts are deployed using the first signer/account by default
  const [deployer, multisig, kycSigner, kycSigner2, alice, bob, charlie] = await ethers.getSigners();

  // Deploy Compliance contract
  const Compliance = (await ethers.getContractFactory("Compliance")) as Compliance__factory;
  const complianceProxy = await upgrades.deployProxy(Compliance, [kycSigner.address, multisig.address]);
  const compliance = Compliance.attach(await complianceProxy.getAddress()) as Compliance;
  const complianceAddress = await complianceProxy.getAddress();

  // Add Alice, Bob to Compliance
  const eip712Domain = await compliance.eip712Domain();
  const multisigIdentity = {
    wallet: multisig.address,
    signer: kycSigner.address,
    emailHash: ethers.keccak256(ethers.toUtf8Bytes("multisig@yieldbricks.com")),
    expiration: (await time.latest()) + 60 * 60 * 24 * 7, // 7 days
    country: 0,
  };

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

  const multisigData = identityTypedMessage(eip712Domain, multisigIdentity);
  const aliceData = identityTypedMessage(eip712Domain, aliceIdentity);
  const bobData = identityTypedMessage(eip712Domain, bobIdentity);
  const charlieData = identityTypedMessage(eip712Domain, charlieIdentity);

  const multisigSignature = await kycSigner.signTypedData(
    multisigData.domain,
    multisigData.types,
    multisigData.identity,
  );
  const aliceSignature = await kycSigner.signTypedData(aliceData.domain, aliceData.types, aliceData.identity);
  const bobSignature = await kycSigner.signTypedData(bobData.domain, bobData.types, bobData.identity);
  const charlieSignature = await kycSigner.signTypedData(charlieData.domain, charlieData.types, charlieData.identity);

  await compliance.addIdentity(multisigIdentity, multisigSignature);
  await compliance.addIdentity(aliceIdentity, aliceSignature);
  await compliance.addIdentity(bobIdentity, bobSignature);
  await compliance.addIdentity(charlieIdentity, charlieSignature);

  console.log("Compliance deployed to:", await compliance.getAddress());

  // Deploy YBR contract
  const YBR = (await ethers.getContractFactory("EthYBR")) as EthYBR__factory;
  const YBRProxy = await upgrades.deployProxy(YBR, [multisig.address, ZERO_ADDRESS, ZERO_ADDRESS], {
    unsafeAllow: ["internal-function-storage"],
    initializer: "initialize",
  });
  const ybr = YBR.attach(await YBRProxy.getAddress()) as EthYBR;
  const ybrAddress = await ybr.getAddress();

  const Tiers = (await ethers.getContractFactory("TiersV1")) as Tiers__factory;
  const TiersProxy = await upgrades.deployProxy(Tiers, [multisig.address, ybrAddress], {
    unsafeAllow: ["internal-function-storage"],
  });
  const tiers = Tiers.attach(await TiersProxy.getAddress()) as Tiers;
  const tiersAddress = await tiers.getAddress();

  console.log("Tiers deployed to:", tiersAddress);

  await tiers.connect(multisig).setTierOverride(alice.address, 5);

  // Deploy Token contract
  const Property = (await ethers.getContractFactory("Property")) as Property__factory;
  const propertyProxy = await upgrades.deployProxy(Property, [alice.address, "TestToken", "TT", 1000000], {
    unsafeAllow: ["internal-function-storage"],
    constructorArgs: [complianceAddress, tiersAddress],
  });
  const property = Property.attach(await propertyProxy.getAddress()) as Property;
  const propertyAddress = await property.getAddress();

  return {
    compliance,
    complianceAddress,
    property,
    propertyAddress,
    ybr,
    ybrAddress,
    tiers,
    tiersAddress,
    deployer,
    multisig,
    alice,
    bob,
    charlie,
    kycSigner,
    kycSigner2,
  };
}
