import { ethers, upgrades } from "hardhat";

import { ZERO_ADDRESS } from "../test/utils";
import {
  Compliance__factory,
  Property__factory,
  SaleManager__factory,
  TiersV1__factory as Tiers__factory,
  YieldbricksOracle__factory,
} from "../types";
import { getEnvironment } from "./utils";

const environment = getEnvironment();

async function main() {
  console.log("Upgrading Compliance");

  const Compliance = (await ethers.getContractFactory("Compliance")) as Compliance__factory;
  const compliance = await upgrades.prepareUpgrade(environment.Compliance, Compliance);

  console.log("Compliance new implementation:", compliance);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
