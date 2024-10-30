import { Wallet } from "ethers";
import { ethers } from "hardhat";

import { identityTypedMessage } from "../test/utils";
import { Compliance, Compliance__factory } from "../types";
import { ethersToSafeTransaction, getEnvironment, submitTransactionsToMultisig } from "./utils";

const environment = getEnvironment();

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;
const now = Math.floor(Date.now() / 1000); // Date.now() returns milliseconds, so we convert to seconds
const expiration = now + ONE_YEAR_IN_SECONDS * 10;

async function main() {
  console.log("Adding SaleManager to Compliance");

  const Compliance = (await ethers.getContractFactory("Compliance")) as Compliance__factory;
  const compliance = Compliance.attach(environment.Compliance) as Compliance;

  const signer = new Wallet(process.env.KYC_SIGNER_PRIVATE_KEY!);

  console.log("Signer Key:", signer.privateKey);
  console.log("Signer Address:", signer.address);

  const setIdentitySignerTx = await compliance.setIdentitySigner.populateTransaction(signer.address);

  const eip712Domain = await compliance.eip712Domain();
  const complianceIdentity = {
    wallet: environment.SaleManager,
    signer: signer.address,
    emailHash: ethers.keccak256(ethers.toUtf8Bytes("compliance@yieldbricks.com")),
    expiration, // 10 years
    country: 0,
  };

  const complianceData = identityTypedMessage(eip712Domain, complianceIdentity);
  const complianceSignature = await signer.signTypedData(
    complianceData.domain,
    complianceData.types,
    complianceData.identity,
  );

  const multisigIdentity = {
    wallet: environment.Multisig,
    signer: signer.address,
    emailHash: ethers.keccak256(ethers.toUtf8Bytes("multisig@yieldbricks.com")),
    expiration, // 10 years
    country: 0,
  };

  const multisigData = identityTypedMessage(eip712Domain, multisigIdentity);
  const multisigSignature = await signer.signTypedData(multisigData.domain, multisigData.types, multisigData.identity);

  const addComplianceIdentityTx = await compliance.addIdentity.populateTransaction(
    complianceIdentity,
    complianceSignature,
  );

  const addMultisigIdentityTx = await compliance.addIdentity.populateTransaction(multisigIdentity, multisigSignature);

  console.log("transactions", [
    ethersToSafeTransaction(setIdentitySignerTx),
    ethersToSafeTransaction(addComplianceIdentityTx),
    ethersToSafeTransaction(addMultisigIdentityTx),
  ]);

  await submitTransactionsToMultisig({
    transactions: [
      ethersToSafeTransaction(setIdentitySignerTx),
      ethersToSafeTransaction(addComplianceIdentityTx),
      ethersToSafeTransaction(addMultisigIdentityTx),
    ],
    environment,
  });
  console.log("Adding KYC Signer: ", signer.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
