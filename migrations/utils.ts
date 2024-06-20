import SafeApiKit from "@safe-global/api-kit";
import Safe from "@safe-global/protocol-kit";
import { MetaTransactionData } from "@safe-global/safe-core-sdk-types";
import { ContractTransaction, computeAddress } from "ethers";
import { network } from "hardhat";
import { HttpNetworkConfig } from "hardhat/types";

import arbitrumOne from "./arbitrum-one";
import sepolia from "./sepolia";

export type Environment = {
  url: string;
  chainId: number;
  deployerKey: string;
  Compliance: string;
  PropertyBeacon: string;
  YBR: string;
  ChainlinkOracle: string;
  SaleManager: string;
  multisig: string;
  chainlinkFeeds: {
    feedName: string;
    asset: string;
    feed: string;
    tokenDecimals: number;
    priceDecimals: number;
  }[];
  kycSigners: string[];
};

export function getEnvironment(): Environment {
  let env;
  if (network.name === "sepolia") {
    env = sepolia;
  } else if (network.name === "arbitrum-one") {
    env = arbitrumOne;
  } else {
    throw new Error(`Unknown network ${network.name}`);
  }
  const config = network.config as HttpNetworkConfig;
  if (!config.chainId) throw new Error("Chain ID not found in network config");
  env = { ...env, url: config.url, chainId: config.chainId, deployerKey: (config.accounts as string[])[0] };
  return env;
}

export function ethersToSafeTransaction(tx: ContractTransaction): MetaTransactionData {
  if (!tx.to) throw new Error("Transaction must have a to field");
  if (!tx.data) throw new Error("Transaction must have a data field");

  return {
    to: tx.to,
    value: tx.value ? tx.value.toString() : "0",
    data: tx.data,
  };
}

type TransactionToMultisigProps = {
  transactions: MetaTransactionData[];
  environment: Environment;
};

export async function submitTransactionsToMultisig({ transactions, environment }: TransactionToMultisigProps) {
  const protocolKit = await Safe.init({
    provider: environment.url,
    signer: environment.deployerKey,
    safeAddress: environment.multisig,
  });

  const safeTransaction = await protocolKit.createTransaction({ transactions });

  const safeTxHash = await protocolKit.getTransactionHash(safeTransaction);
  const signature = await protocolKit.signHash(safeTxHash);

  const apiKit = new SafeApiKit({
    chainId: BigInt(environment.chainId),
  });

  // Propose transaction to the service
  try {
    await apiKit.proposeTransaction({
      safeAddress: await protocolKit.getAddress(),
      safeTransactionData: safeTransaction.data,
      safeTxHash,
      senderAddress: computeAddress(environment.deployerKey),
      senderSignature: signature.data,
    });
  } catch (e) {
    throw new Error(`Failed to propose transaction: ${e}`);
  }
}
