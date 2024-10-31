import { AddressLike } from "ethers";
import { ethers } from "hardhat";

import { SaleManager, SaleManager__factory } from "../types";
import { ethersToSafeTransaction, getEnvironment, submitTransactionsToMultisig } from "./utils";

const environment = getEnvironment();
const address: AddressLike = "0xcf198317ef8618890b3a9dc9d4ff907ad99deab2";
const start = Date.parse("2024-10-30") / 1000;
const end = Date.parse("2028-10-30") / 1000;
const price = 50;

async function main() {
  console.log(
    `Creating sale for token ${address} from ${new Date(start * 1000)} to ${new Date(end * 1000)} with price ${price} USD`,
  );

  const SaleManager = (await ethers.getContractFactory("SaleManager")) as SaleManager__factory;
  const saleManager = SaleManager.attach(environment.SaleManager) as SaleManager;

  const createSaleTx = await saleManager.createSale.populateTransaction(address, start, end, price);

  console.log(ethersToSafeTransaction(createSaleTx));

  await submitTransactionsToMultisig({
    transactions: [ethersToSafeTransaction(createSaleTx)],
    environment,
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
