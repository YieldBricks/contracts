import { ethers, upgrades } from "hardhat";

import { ZERO_ADDRESS } from "../test/utils";
import {
  ChainlinkOracle__factory,
  Compliance__factory,
  Property__factory,
  SaleManager__factory,
  TiersV0__factory as Tiers__factory,
} from "../types";
import { getEnvironment } from "./utils";

const environment = getEnvironment();

async function main() {
  console.log("Deploying Oracle");

  const Oracle = (await ethers.getContractFactory("YieldbricksOracle")) as ChainlinkOracle__factory;
  const oracle = await upgrades.deployProxy(Oracle, [environment.Multisig], {
    initializer: "initialize",
    redeployImplementation: "onchange",
    salt: "oracle",
    initialOwner: environment.Multisig,
  });

  await oracle.waitForDeployment();

  console.log("Oracle deployed to:", await oracle.getAddress());

  console.log("Deploying Tiers");

  const Tiers = (await ethers.getContractFactory("TiersV0")) as Tiers__factory;
  const tiers = await upgrades.deployProxy(Tiers, [environment.Multisig, environment.YBR], {
    initializer: "initialize",
    redeployImplementation: "onchange",
    salt: "tiers",
    initialOwner: environment.Multisig,
  });

  await tiers.waitForDeployment();

  console.log("Tiers deployed to:", await tiers.getAddress());

  console.log("Deploying Compliance");

  const Compliance = (await ethers.getContractFactory("Compliance")) as Compliance__factory;
  const compliance = await upgrades.deployProxy(
    Compliance,
    [
      ZERO_ADDRESS, // KYC Address
      environment.Multisig,
    ],
    {
      initializer: "initialize",
      redeployImplementation: "onchange",
      initialOwner: environment.Multisig,
    },
  );

  await compliance.waitForDeployment();

  console.log("Compliance deployed to:", await compliance.getAddress());

  console.log("Deploying Property");

  const Property = (await ethers.getContractFactory("Property")) as Property__factory;
  const property = await upgrades.deployBeacon(Property, {
    initialOwner: environment.Multisig,
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
      environment.Multisig,
      await oracle.getAddress(), // Oracle address
      await tiers.getAddress(), // Tiers address
    ],
    {
      initializer: "initialize",
      initialOwner: environment.Multisig,
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
