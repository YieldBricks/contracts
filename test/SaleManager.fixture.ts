import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, upgrades } from "hardhat";

import {
  Compliance,
  Compliance__factory,
  EthYBR,
  EthYBR__factory,
  MockOracle,
  MockOracle__factory,
  Property__factory,
  SaleManager,
  SaleManager__factory,
  TiersV1 as Tiers,
  TiersV1__factory as Tiers__factory,
} from "../types";
import { ZERO_ADDRESS, identityTypedMessage } from "./utils";

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
  const propertyBeacon = await upgrades.deployBeacon(Property, {
    initialOwner: multisig.address,
    unsafeAllow: ["internal-function-storage"],
    constructorArgs: [complianceAddress, ZERO_ADDRESS],
  });
  const propertyBeaconAddress = await propertyBeacon.getAddress();

  console.log("TokenBeacon deployed to:", propertyBeaconAddress);

  const YBR = (await ethers.getContractFactory("EthYBR")) as EthYBR__factory;
  const ybrProxy = await upgrades.deployProxy(YBR, [multisig.address, ZERO_ADDRESS, ZERO_ADDRESS], {
    unsafeAllow: ["internal-function-storage"],
    initializer: "initialize",
  });
  const ybr = YBR.attach(await ybrProxy.getAddress()) as EthYBR;
  const ybrAddress = await ybrProxy.getAddress();

  const MockOracle = (await ethers.getContractFactory("MockOracle")) as MockOracle__factory;
  const mockOracle = (await MockOracle.deploy()) as MockOracle;
  await mockOracle.waitForDeployment();
  const mockOracleAddress = await mockOracle.getAddress();

  console.log("mockOracleAddress", mockOracleAddress);

  const Tiers = (await ethers.getContractFactory("TiersV1")) as Tiers__factory;
  const TiersProxy = await upgrades.deployProxy(Tiers, [multisig.address, ybrAddress], {
    unsafeAllow: ["internal-function-storage"],
  });
  const tiers = Tiers.attach(await TiersProxy.getAddress()) as Tiers;
  const tiersAddress = await tiers.getAddress();

  console.log("tiersAddress", tiersAddress);

  // Deploy SaleManager contract
  const SaleManager = (await ethers.getContractFactory("SaleManager")) as SaleManager__factory;
  const saleManagerProxy = await upgrades.deployProxy(SaleManager, [
    propertyBeaconAddress,
    multisig.address,
    mockOracleAddress,
    tiersAddress,
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
    tiers,
    tiersAddress,
    mockOracle,
    mockOracleAddress,
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
