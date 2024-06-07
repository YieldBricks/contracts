import { defender, ethers, upgrades } from "hardhat";

import { ZERO_ADDRESS } from "../test/utils";
import { Compliance__factory, Property__factory, SaleManager__factory, YBR__factory } from "../types";

const salt = "YieldBricks";

async function main() {
  const upgradeApprovalProcess = await defender.getUpgradeApprovalProcess();

  // Contains the multisig address
  if (upgradeApprovalProcess.address === undefined) {
    throw new Error(
      `Upgrade approval process with id ${upgradeApprovalProcess.approvalProcessId} has no assigned address`,
    );
  }

  console.log("Deploying Compliance");

  const Compliance = (await ethers.getContractFactory("Compliance")) as Compliance__factory;
  const compliance = await defender.deployProxy(
    Compliance,
    [
      ZERO_ADDRESS, // KYC Address
      upgradeApprovalProcess.address,
    ],
    {
      initializer: "initialize",
      salt,
      redeployImplementation: "never",
    },
  );

  console.log("Waiting for deployment");

  await compliance.waitForDeployment();

  console.log("compliance", compliance, await compliance.getAddress());

  console.log("Deploying Property");

  const Property = (await ethers.getContractFactory("Property")) as Property__factory;
  const property = await upgrades.deployBeacon(Property, {
    initialOwner: upgradeApprovalProcess.address,
    redeployImplementation: "never",
  });

  console.log("Waiting for deployment");

  await property.waitForDeployment();

  console.log("property", property, await property.getAddress());

  console.log("Deploying SaleManager");

  const SaleManager = (await ethers.getContractFactory("SaleManager")) as SaleManager__factory;
  const saleManager = await defender.deployProxy(
    SaleManager,
    [
      await property.getAddress(),
      upgradeApprovalProcess.address,
      ZERO_ADDRESS, // Oracle address
    ],
    {
      initializer: "initialize",
      salt,
      redeployImplementation: "never",
    },
  );

  console.log("Waiting for deployment");

  await saleManager.waitForDeployment();

  console.log("saleManager", saleManager, await saleManager.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
