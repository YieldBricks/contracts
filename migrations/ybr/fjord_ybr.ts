import { ethers } from "hardhat";

import { FjordYBR__factory } from "../../types";
import { getEnvironment } from "../utils";

const environment = getEnvironment();

async function main() {
  console.log("Deploying Fjord YBR");

  const FjYBR = (await ethers.getContractFactory("FjordYBR")) as FjordYBR__factory;
  const ethYBR = await FjYBR.deploy(environment.Multisig);
  console.log("Fjord YBR deployed to:", await ethYBR.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
