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
  Multisig: string;
  chainlinkFeeds: {
    feedName: string;
    asset: string;
    feed: string;
    tokenDecimals: number;
    priceDecimals: number;
  }[];
  kycSigners: string[];
  EthYBR?: string;
  EthMultisig?: string;
};

export function getEnvironment(): Environment {
  let env;
  if (network.name === "sepolia" || network.name == "arbitrum-sepolia") {
    env = sepolia;
  } else if (network.name === "arbitrum" || network.name == "mainnet") {
    env = arbitrumOne;
  } else {
    throw new Error(`Unknown network ${network.name}`);
  }
  const config = network.config as HttpNetworkConfig;
  if (!config.chainId) throw new Error("Chain ID not found in network config");
  env = { ...env, url: config.url, chainId: config.chainId, deployerKey: (config.accounts as string[])[0] };
  return env;
}

export type ArbitrumBridge = {
  L1Router: string;
  L1Gateway: string;
  L2Gateway: string;
};

export function getArbitrumBridge(): ArbitrumBridge {
  let bridge;
  if (network.name == "sepolia" || network.name == "arbitrum-sepolia") {
    bridge = {
      L1Router: "0xcE18836b233C83325Cc8848CA4487e94C6288264",
      L1Gateway: "0xba2F7B6eAe1F9d174199C5E4867b563E0eaC40F3",
      L2Gateway: "0x8Ca1e1AC0f260BC4dA7Dd60aCA6CA66208E642C5",
    };
  } else if (network.name == "arbitrum" || network.name == "mainnet") {
    bridge = {
      L1Router: "0x72Ce9c846789fdB6fC1f34aC4AD25Dd9ef7031ef",
      L1Gateway: "0xcEe284F754E854890e311e3280b767F80797180d",
      L2Gateway: "0x096760F208390250649E3e8763348E783AEF5562",
    };
  } else {
    throw new Error(`Unknown network ${network.name}`);
  }
  return bridge;
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
    safeAddress: environment.Multisig,
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
