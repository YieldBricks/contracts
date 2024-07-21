import { ethers, upgrades } from "hardhat";

import { ArbYBR__factory } from "../../types";
import { getArbitrumBridge, getEnvironment } from "../utils";

const environment = getEnvironment();
const bridge = getArbitrumBridge();

async function main() {
  console.log("Deploying YBR Eth");

  const ArbYBR = (await ethers.getContractFactory("ArbYBR")) as ArbYBR__factory;
  const arbYBR = await upgrades.deployProxy(ArbYBR, [environment.EthMultisig, bridge.L2Gateway, environment.EthYBR], {
    initializer: "initialize",
    redeployImplementation: "never",
    salt: "ArbYBR",
    initialOwner: environment.EthMultisig,
  });

  console.log("ArbYBR deployed to:", await arbYBR.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
