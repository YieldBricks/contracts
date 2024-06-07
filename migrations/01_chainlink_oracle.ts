import { defender, ethers } from "hardhat";

import { ChainlinkOracle__factory } from "../types";

const salt = "YieldBricks";

async function main() {
  const upgradeApprovalProcess = await defender.getUpgradeApprovalProcess();

  // Contains the multisig address
  if (upgradeApprovalProcess.address === undefined) {
    throw new Error(
      `Upgrade approval process with id ${upgradeApprovalProcess.approvalProcessId} has no assigned address`,
    );
  }

  const Oracle = (await ethers.getContractFactory("ChainlinkOracle")) as ChainlinkOracle__factory;
  const oracle = await defender.deployProxy(Oracle, [upgradeApprovalProcess.address], {
    initializer: "initialize",
    salt,
    redeployImplementation: "onchange",
  });

  await oracle.waitForDeployment();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
