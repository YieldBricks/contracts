import { ethers, upgrades } from "hardhat";

import { Escrow__factory } from "../../types";
import { getEnvironment } from "../utils";

const environment = getEnvironment();

const USDT = "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9";

async function main() {
  console.log("Deploying Escrow");

  const Escrow = (await ethers.getContractFactory("Escrow")) as Escrow__factory;
  const escrow = await upgrades.deployProxy(Escrow, [environment.Multisig, environment.YBR, USDT], {
    initializer: "initialize",
    redeployImplementation: "onchange",
    salt: "escrow",
    initialOwner: environment.Multisig,
  });

  await escrow.waitForDeployment();

  console.log("Escrow deployed to:", await escrow.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
