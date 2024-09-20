import { ethers, upgrades } from "hardhat";

import { YieldbricksOracle__factory } from "../types";
import { getEnvironment } from "./utils";

const environment = getEnvironment();

async function main() {
  console.log("Upgrading YieldbricksOracle");

  const YieldbricksOracle = (await ethers.getContractFactory("YieldbricksOracle")) as YieldbricksOracle__factory;
  const yieldbricksOracle = await upgrades.prepareUpgrade(environment.YieldbricksOracle, YieldbricksOracle);

  console.log("YieldbricksOracle new implementation:", yieldbricksOracle);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
