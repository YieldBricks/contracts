import { MetaTransactionData } from "@safe-global/safe-core-sdk-types";
import { ethers } from "hardhat";

import { ChainlinkOracle, ChainlinkOracle__factory } from "../types";
import { ethersToSafeTransaction, getEnvironment, submitTransactionsToMultisig } from "./utils";

const environment = getEnvironment();

async function main() {
  console.log("Setting price feeds");

  const Oracle = (await ethers.getContractFactory("ChainlinkOracle")) as ChainlinkOracle__factory;
  const oracle = Oracle.attach(environment.ChainlinkOracle) as ChainlinkOracle;

  const transactions: MetaTransactionData[] = [];

  for (const feed of environment.chainlinkFeeds) {
    console.log(`Setting price feed for ${feed.feedName}`);
    const tx = await oracle.setFeed.populateTransaction(feed.asset, feed.feed, feed.tokenDecimals, feed.priceDecimals);
    console.log("TX", tx);
    transactions.push(ethersToSafeTransaction(tx));
  }

  await submitTransactionsToMultisig({ transactions, environment });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
