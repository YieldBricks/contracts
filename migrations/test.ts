import { defender, ethers, network, upgrades } from "hardhat";

import { ChainlinkOracle__factory } from "../types";
import { getEnvironment } from "./utils";

const salt = "YieldBricks";

async function main() {
  const networkName = getEnvironment();

  console.log(networkName);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
