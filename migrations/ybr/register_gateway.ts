import { ParentToChildMessageStatus, getArbitrumNetwork } from "@arbitrum/sdk";
import { AdminErc20Bridger } from "@arbitrum/sdk/dist/lib/assetBridger/erc20Bridger";
import { ethers as ethersV5 } from "ethers-v5";
import { network } from "hardhat";
import { HttpNetworkUserConfig } from "hardhat/types";

import { chainIds, getChainConfig } from "../../hardhat.config";
import { getArbitrumBridge, getEnvironment } from "../utils";

const environment = getEnvironment();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const bridge = getArbitrumBridge();

const l1Config = getChainConfig(network.name as keyof typeof chainIds) as HttpNetworkUserConfig;
const l2Config = getChainConfig(
  network.name == "mainnet" ? "arbitrum-mainnet" : "arbitrum-sepolia",
) as HttpNetworkUserConfig;
const l1Provider = new ethersV5.providers.JsonRpcProvider(l1Config.url);
const l2Provider = new ethersV5.providers.JsonRpcProvider(l2Config.url);

if (network.name !== "mainnet" && network.name !== "sepolia") {
  throw new Error(`Must run with L1 network`);
}
async function main() {
  const deployer = new ethersV5.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, l1Provider);

  console.log(deployer, l2Provider);

  const l2Network = getArbitrumNetwork(l2Config.chainId!);

  console.log(`Registering token on L2: ${l2Network}`);

  const adminTokenBridger = new AdminErc20Bridger(l2Network);
  console.log(`Initialized adminTokenBridger ${adminTokenBridger}`);

  console.log("Environment", environment);

  const registerTokenTx = await adminTokenBridger.registerCustomToken(
    environment.EthYBR!,
    environment.YBR,
    deployer,
    l2Provider,
  );

  console.log(`Register token tx hash: ${registerTokenTx.hash}`);

  const registerTokenRec = await registerTokenTx.wait();

  console.log(`Register token receipt: ${registerTokenRec.transactionHash}`);

  /**
   * The L1 side is confirmed; now we listen and wait for the L2 side to be executed; we can do this by computing the expected txn hash of the L2 transaction.
   * To compute this txn hash, we need our message's "sequence numbers", unique identifiers of each L1 to L2 message.
   * We'll fetch them from the event logs with a helper method.
   */
  const l1ToL2Msgs = await registerTokenRec.getParentToChildMessages(l2Provider);

  console.log(`Should be 2 messages: ${l1ToL2Msgs.length === 2}`);
  console.log("L1 to L2 messages", l1ToL2Msgs);

  const setTokenTx = await l1ToL2Msgs[0].waitForStatus();
  console.log(`Set token not redeemed: ${setTokenTx.status === ParentToChildMessageStatus.REDEEMED}`);

  const setGateways = await l1ToL2Msgs[1].waitForStatus();
  console.log(`Set gateways not redeemed: ${setGateways.status === ParentToChildMessageStatus.REDEEMED}`);

  console.log("Your custom token is now registered on our custom gateway 🥳  Go ahead and make the deposit!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
