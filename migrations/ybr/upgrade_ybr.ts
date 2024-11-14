import { ethers, upgrades } from "hardhat";

import { EthYBR__factory } from "../../types";
import { getEnvironment } from "../utils";

const environment = getEnvironment();

async function main() {
  console.log("Upgrading EthYBR");

  const EthYBR = (await ethers.getContractFactory("EthYBR")) as EthYBR__factory;
  const ethYBR = await upgrades.prepareUpgrade(environment.EthYBR!, EthYBR);

  console.log("EthYBR new implementation:", ethYBR);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
