import { ethers, upgrades } from "hardhat";

import { ZERO_ADDRESS } from "../test/utils";
import {
  ChainlinkOracle__factory,
  Compliance__factory,
  Property__factory,
  SaleManager__factory,
  YBR__factory,
} from "../types";
import { getEnvironment } from "./utils";

const environment = getEnvironment();

async function main() {
  console.log("Deploying Oracle");

  const Oracle = (await ethers.getContractFactory("ChainlinkOracle")) as ChainlinkOracle__factory;
  const oracle = await upgrades.deployProxy(Oracle, [environment.multisig], {
    initializer: "initialize",
    redeployImplementation: "onchange",
    salt: "oracle",
    initialOwner: environment.multisig,
  });

  await oracle.waitForDeployment();

  console.log("Oracle deployed to:", await oracle.getAddress());

  console.log("Deploying Compliance");

  const Compliance = (await ethers.getContractFactory("Compliance")) as Compliance__factory;
  const compliance = await upgrades.deployProxy(
    Compliance,
    [
      ZERO_ADDRESS, // KYC Address
      environment.multisig,
    ],
    {
      initializer: "initialize",
      redeployImplementation: "onchange",
      initialOwner: environment.multisig,
    },
  );

  await compliance.waitForDeployment();

  console.log("Compliance deployed to:", await compliance.getAddress());

  console.log("Deploying Property");

  const Property = (await ethers.getContractFactory("Property")) as Property__factory;
  const property = await upgrades.deployBeacon(Property, {
    initialOwner: environment.multisig,
    redeployImplementation: "onchange",
  });

  await property.waitForDeployment();

  console.log("Property deployed to:", await property.getAddress());

  console.log("Deploying SaleManager");

  const SaleManager = (await ethers.getContractFactory("SaleManager")) as SaleManager__factory;
  const saleManager = await upgrades.deployProxy(
    SaleManager,
    [
      await property.getAddress(),
      environment.multisig,
      await oracle.getAddress(), // Oracle address
    ],
    {
      initializer: "initialize",
      initialOwner: environment.multisig,
      redeployImplementation: "onchange",
    },
  );

  await saleManager.waitForDeployment();

  console.log("SaleManager deployed to:", await saleManager.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
