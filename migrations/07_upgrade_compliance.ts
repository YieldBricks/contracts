import { ethers, upgrades } from "hardhat";

import { ZERO_ADDRESS } from "../test/utils";
import {
  Compliance__factory,
  Property__factory,
  SaleManager__factory,
  TiersV1__factory as Tiers__factory,
  YieldbricksOracle__factory,
} from "../types";
import { getEnvironment } from "./utils";

const environment = getEnvironment();

async function main() {
  console.log("Upgrading Compliance");

  const Compliance = (await ethers.getContractFactory("Compliance")) as Compliance__factory;
  const compliance = await upgrades.prepareUpgrade(environment.Compliance, Compliance);

  upgrades.validateUpgrade();

  console.log("Compliance new implementation:", compliance);

  // console.log("Adding SaleManager to Compliance");

  // const signer = new Wallet("73ffa3d47e8ca31886642a0ecce2d8e4750eff5f185862cdd375fc47ff39ecb0");

  // console.log("Signer Key:", signer.privateKey);
  // console.log("Signer Address:", signer.address);

  // const setIdentitySignerTx = await compliance.setIdentitySigner.populateTransaction(signer.address);

  // const eip712Domain = await compliance.eip712Domain();
  // const complianceIdentity = {
  //   wallet: environment.SaleManager,
  //   signer: signer.address,
  //   emailHash: ethers.keccak256(ethers.toUtf8Bytes("compliance@yieldbricks.com")),
  //   expiration, // 1 year
  //   country: 0,
  // };

  // const complianceData = identityTypedMessage(eip712Domain, complianceIdentity);
  // const complianceSignature = await signer.signTypedData(
  //   complianceData.domain,
  //   complianceData.types,
  //   complianceData.identity,
  // );

  // const addIdentityTx = await compliance.addIdentity.populateTransaction(complianceIdentity, complianceSignature);

  // console.log("transactions", ethersToSafeTransaction(setIdentitySignerTx), ethersToSafeTransaction(addIdentityTx));

  // await submitTransactionsToMultisig({
  //   transactions: [ethersToSafeTransaction(setIdentitySignerTx), ethersToSafeTransaction(addIdentityTx)],
  //   environment,
  // });
  // console.log("Adding KYC Signer: ", signer.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
