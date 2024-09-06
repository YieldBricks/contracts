import { ethers, upgrades } from "hardhat";

import { Property__factory, TiersV1__factory as Tiers__factory } from "../types";
import { getEnvironment } from "./utils";

const environment = getEnvironment();

async function main() {
  console.log("Upgrading Tiers");

  const Tiers = (await ethers.getContractFactory("TiersV1")) as Tiers__factory;

  const tiers = await upgrades.upgradeProxy(environment.Tiers, Tiers);

  await tiers.waitForDeployment();

  console.log("Tiers upgraded at:", await tiers.getAddress());

  console.log("Upgrading Property");

  const Property = (await ethers.getContractFactory("Property")) as Property__factory;
  const property = await upgrades.upgradeBeacon(environment.PropertyBeacon, Property);

  await property.waitForDeployment();

  console.log("Property upgraded at:", await property.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
