import { ethers, upgrades } from "hardhat";

import { Compliance, Compliance__factory, SaleManager, SaleManager__factory, Token__factory } from "../types";

export async function deploySystemFixture() {
  // Contracts are deployed using the first signer/account by default
  const [owner, kycSigner, alice, bob, eve] = await ethers.getSigners();

  // Deploy Compliance contract
  const Compliance = (await ethers.getContractFactory("Compliance")) as Compliance__factory;
  const complianceProxy = await upgrades.deployProxy(Compliance, [kycSigner.address]);
  const compliance = Compliance.attach(await complianceProxy.getAddress()) as Compliance;

  // Deploy BeaconProxy contract
  const Token = (await ethers.getContractFactory("Token")) as Token__factory;
  const tokenBeacon = await upgrades.deployBeacon(Token);

  // Deploy SaleManager contract
  const SaleManager = (await ethers.getContractFactory("SaleManager")) as SaleManager__factory;
  const saleManagerProxy = await upgrades.deployProxy(SaleManager, [tokenBeacon.address]);
  const saleManager = SaleManager.attach(await saleManagerProxy.getAddress()) as SaleManager;

  return { compliance, saleManager, tokenBeacon, owner, alice, bob, eve };
}
