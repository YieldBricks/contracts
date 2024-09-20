import { ethers, upgrades } from "hardhat";

import { SaleManager__factory } from "../types";
import { getEnvironment } from "./utils";

const environment = getEnvironment();

async function main() {
  console.log("Upgrading SaleManager");

  const SaleManager = (await ethers.getContractFactory("SaleManager")) as SaleManager__factory;
  const saleManager = await upgrades.prepareUpgrade(environment.SaleManager, SaleManager);

  console.log("SaleManager new implementation:", saleManager);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
