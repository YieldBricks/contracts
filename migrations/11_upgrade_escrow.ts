import { ethers, upgrades } from "hardhat";

import { Escrow__factory } from "../types";
import { getEnvironment } from "./utils";

const environment = getEnvironment();

async function main() {
  console.log("Upgrading Escrow");

  const Escrow = (await ethers.getContractFactory("Escrow")) as Escrow__factory;
  const escrow = await upgrades.prepareUpgrade(environment.Escrow, Escrow);

  console.log("Tiers new implementation:", escrow);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
