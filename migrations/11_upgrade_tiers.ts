import { ethers, upgrades } from "hardhat";

import { TiersV1__factory } from "../types";
import { getEnvironment } from "./utils";

const environment = getEnvironment();

async function main() {
  console.log("Upgrading Tiers");

  const Tiers = (await ethers.getContractFactory("TiersV1")) as TiersV1__factory;
  const tiers = await upgrades.prepareUpgrade(environment.Tiers, Tiers);

  console.log("Tiers new implementation:", tiers);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
