import { ethers, upgrades } from "hardhat";

import { ArbYBR__factory } from "../../types";
import { getEnvironment } from "../utils";

const environment = getEnvironment();

async function main() {
  console.log("Upgrading ArbYBR");

  const ArbYBR = (await ethers.getContractFactory("ArbYBR")) as ArbYBR__factory;
  const arbYBR = await upgrades.prepareUpgrade(environment.YBR!, ArbYBR);

  console.log("ArbYBR new implementation:", arbYBR);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
