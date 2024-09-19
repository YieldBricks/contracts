import { MetaTransactionData } from "@safe-global/safe-core-sdk-types";
import { ethers } from "hardhat";

import { SaleManager, SaleManager__factory } from "../types";
import { ethersToSafeTransaction, getEnvironment, submitTransactionsToMultisig } from "./utils";

const environment = getEnvironment();

async function main() {
  console.log(`Adding whiteliisted payment tokens to SaleManager`);

  const SaleManager = (await ethers.getContractFactory("SaleManager")) as SaleManager__factory;
  const saleManager = SaleManager.attach(environment.SaleManager) as SaleManager;

  const transactions: MetaTransactionData[] = [];

  for (const feed of environment.chainlinkFeeds) {
    console.log(`Adding whitelisted token ${feed.feedName} (${feed.asset})`);
    const tx = await saleManager.whitelistPaymentToken.populateTransaction(feed.asset, true);
    console.log("TX", tx);
    transactions.push(ethersToSafeTransaction(tx));
  }

  console.log("transactions", transactions);

  await submitTransactionsToMultisig({ transactions, environment });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
