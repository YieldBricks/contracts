import { ethers, upgrades } from "hardhat";

import { Compliance, Compliance__factory, SaleManager, SaleManager__factory, Token__factory } from "../types";

export async function deploySystemFixture() {
  // Contracts are deployed using the first signer/account by default
  const [deployer, multisig, kycSigner, alice, bob, eve] = await ethers.getSigners();

  // Deploy Compliance contract
  const Compliance = (await ethers.getContractFactory("Compliance")) as Compliance__factory;
  const complianceProxy = await upgrades.deployProxy(Compliance, [kycSigner.address, multisig.address]);
  const compliance = Compliance.attach(await complianceProxy.getAddress()) as Compliance;
  const complianceAddress = await complianceProxy.getAddress();

  console.log("Compliance deployed to:", await compliance.getAddress());

  // Deploy BeaconProxy contract
  const Token = (await ethers.getContractFactory("Token")) as Token__factory;
  const tokenBeacon = await upgrades.deployBeacon(Token, { initialOwner: multisig.address });
  const tokenBeaconAddress = await tokenBeacon.getAddress();

  console.log("TokenBeacon deployed to:", await tokenBeacon.getAddress());

  // Deploy SaleManager contract
  const SaleManager = (await ethers.getContractFactory("SaleManager")) as SaleManager__factory;
  const saleManagerProxy = await upgrades.deployProxy(SaleManager, [await tokenBeacon.getAddress(), multisig.address]);
  const saleManager = SaleManager.attach(await saleManagerProxy.getAddress()) as SaleManager;
  const saleManagerAddress = await saleManagerProxy.getAddress();

  console.log("SaleManager deployed to:", await saleManager.getAddress());

  return {
    compliance,
    complianceAddress,
    saleManager,
    saleManagerAddress,
    tokenBeacon,
    tokenBeaconAddress,
    deployer,
    multisig,
    alice,
    bob,
    eve,
  };
}
