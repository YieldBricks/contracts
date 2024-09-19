import { Wallet } from "ethers";
import { ethers } from "hardhat";

import { DAY, identityTypedMessage } from "../test/utils";
import { Compliance, Compliance__factory } from "../types";
import { ethersToSafeTransaction, getEnvironment } from "./utils";

const environment = getEnvironment();

const CUSTOM_ADDRESS = environment.Multisig;
const CUSTOM_MAIL = "multisig@yieldbricks.com";
const CUSTOM_EXPIRATION = 10 * 365 * DAY; // 10 years

const now = Math.floor(Date.now() / 1000); // Date.now() returns milliseconds, so we convert to seconds
const expiration = now + CUSTOM_EXPIRATION;

async function main() {
  console.log("Adding SaleManager to Compliance");

  const Compliance = (await ethers.getContractFactory("Compliance")) as Compliance__factory;
  const compliance = Compliance.attach(environment.Compliance) as Compliance;

  const signer = new Wallet(process.env.KYC_SIGNER_PRIVATE_KEY!);

  console.log("Signer Address:", signer.address);

  const eip712Domain = await compliance.eip712Domain();
  const complianceIdentity = {
    wallet: CUSTOM_ADDRESS,
    signer: signer.address,
    emailHash: ethers.keccak256(ethers.toUtf8Bytes(CUSTOM_MAIL)),
    expiration, // 1 year
    country: 0,
  };

  const complianceData = identityTypedMessage(eip712Domain, complianceIdentity);
  const complianceSignature = await signer.signTypedData(
    complianceData.domain,
    complianceData.types,
    complianceData.identity,
  );

  const addIdentityTx = await compliance.addIdentity.populateTransaction(complianceIdentity, complianceSignature);

  console.log("transaction", ethersToSafeTransaction(addIdentityTx));

  console.log("Adding KYC Signer: ", signer.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
