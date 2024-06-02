import { defender, ethers } from "hardhat";

import { ZERO_ADDRESS } from "../test/utils";
import { Compliance__factory, Property__factory, SaleManager__factory, YBR__factory } from "../types";

async function main() {
  const upgradeApprovalProcess = await defender.getUpgradeApprovalProcess();

  if (upgradeApprovalProcess.address === undefined) {
    throw new Error(
      `Upgrade approval process with id ${upgradeApprovalProcess.approvalProcessId} has no assigned address`,
    );
  }

  const Compliance = (await ethers.getContractFactory("Compliance")) as Compliance__factory;
  const compliance = await defender.deployProxy(
    Compliance,
    [
      ZERO_ADDRESS, // KYC Address
      upgradeApprovalProcess.address,
    ],
    {
      initializer: "initialize",
    },
  );

  await compliance.waitForDeployment();

  const Property = (await ethers.getContractFactory("Property")) as Property__factory;
  const property = await defender.deployBeacon(Property, { initialOwner: upgradeApprovalProcess.address });

  await property.waitForDeployment();

  const SaleManager = (await ethers.getContractFactory("SaleManager")) as SaleManager__factory;
  const saleManager = await defender.deployProxy(
    SaleManager,
    [
      property.getAddress(),
      upgradeApprovalProcess.address,
      ZERO_ADDRESS, // Oracle address
    ],
    {
      initializer: "initialize",
    },
  );

  await saleManager.waitForDeployment();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
