import { ethers, upgrades } from "hardhat";

import { EthYBR__factory } from "../../types";
import { getArbitrumBridge, getEnvironment } from "../utils";

const environment = getEnvironment();
const bridge = getArbitrumBridge();

async function main() {
  console.log("Deploying YBR Eth");

  const EthYBR = (await ethers.getContractFactory("EthYBR")) as EthYBR__factory;
  const ethYBR = await upgrades.deployProxy(EthYBR, [environment.EthMultisig, bridge.L1Gateway, bridge.L1Router], {
    initializer: "initialize",
    redeployImplementation: "never",
    salt: "EthYBR",
    initialOwner: environment.EthMultisig,
  });

  console.log("EthYBR deployed to:", await ethYBR.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
