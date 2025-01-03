import { ethers } from "hardhat";

import { SaleManager, SaleManager__factory } from "../types";
import { ethersToSafeTransaction, getEnvironment, submitTransactionsToMultisig } from "./utils";

const environment = getEnvironment();
const name = "YieldBricks Test Property";
const symbol = "YB-003-TEST";
const cap = 1_000_000n * 10n ** 18n;

async function main() {
  console.log(`Creating property token for ${name}, symbol ${symbol} with cap ${cap}`);

  const SaleManager = (await ethers.getContractFactory("SaleManager")) as SaleManager__factory;
  const saleManager = SaleManager.attach(environment.SaleManager) as SaleManager;

  const createTokenTx = await saleManager.createToken.populateTransaction(name, symbol, cap);

  console.log(ethersToSafeTransaction(createTokenTx));

  await submitTransactionsToMultisig({
    transactions: [ethersToSafeTransaction(createTokenTx)],
    environment,
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
