import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, upgrades } from "hardhat";

import {
  Compliance,
  Compliance__factory,
  Property__factory,
  SaleManager,
  SaleManager__factory,
  YBR,
  YBR__factory,
} from "../types";
import { identityTypedMessage } from "./utils";

export async function deploySaleManagerFixture() {
  // Contracts are deployed using the first signer/account by default
  const [deployer, multisig, kycSigner, kycSigner2, alice, bob, charlie, eve] = await ethers.getSigners();

  // Deploy Compliance contract
  const Compliance = (await ethers.getContractFactory("Compliance")) as Compliance__factory;
  const complianceProxy = await upgrades.deployProxy(Compliance, [kycSigner.address, multisig.address]);
  const compliance = Compliance.attach(await complianceProxy.getAddress()) as Compliance;
  const complianceAddress = await complianceProxy.getAddress();

  console.log("Compliance deployed to:", complianceAddress);

  // Deploy BeaconProxy contract
  const Property = (await ethers.getContractFactory("Property")) as Property__factory;
  const propertyBeacon = await upgrades.deployBeacon(Property, { initialOwner: multisig.address });
  const propertyBeaconAddress = await propertyBeacon.getAddress();

  console.log("TokenBeacon deployed to:", propertyBeaconAddress);

  const YBR = (await ethers.getContractFactory("YBR")) as YBR__factory;
  const ybrProxy = await upgrades.deployProxy(YBR, [multisig.address]);
  const ybr = YBR.attach(await ybrProxy.getAddress()) as YBR;
  const ybrAddress = await ybrProxy.getAddress();

  // Deploy SaleManager contract
  const SaleManager = (await ethers.getContractFactory("SaleManager")) as SaleManager__factory;
  const saleManagerProxy = await upgrades.deployProxy(SaleManager, [
    propertyBeaconAddress,
    multisig.address,
    ybrAddress,
  ]);
  const saleManager = SaleManager.attach(await saleManagerProxy.getAddress()) as SaleManager;
  const saleManagerAddress = await saleManagerProxy.getAddress();

  console.log("SaleManager deployed to:", saleManagerAddress);

  // Add SaleManager to Compliance
  const eip712Domain = await compliance.eip712Domain();
  const saleManagerIdentity = {
    wallet: saleManagerAddress,
    signer: kycSigner.address,
    emailHash: ethers.keccak256(ethers.toUtf8Bytes("compliance@yieldbricks.com")),
    expiration: (await time.latest()) + 60 * 60 * 24 * 7, // 7 days
    country: 0,
  };
  console.log("Compliance Identity", saleManagerIdentity);

  const saleManagerData = identityTypedMessage(eip712Domain, saleManagerIdentity);

  const saleManagerSignature = await kycSigner.signTypedData(
    saleManagerData.domain,
    saleManagerData.types,
    saleManagerData.identity,
  );

  await compliance.addIdentity(saleManagerIdentity, saleManagerSignature);

  return {
    compliance,
    complianceAddress,
    saleManager,
    saleManagerAddress,
    propertyBeacon,
    propertyBeaconAddress,
    ybr,
    ybrAddress,
    deployer,
    multisig,
    alice,
    bob,
    charlie,
    eve,
    kycSigner,
    kycSigner2,
  };
}
