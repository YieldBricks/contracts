import { getL2Network } from "@arbitrum/sdk";
import { Wallet, providers } from "ethers";
import { ethers, upgrades } from "hardhat";

import { EthYBR__factory } from "../types";
import { getArbitrumBridge, getEnvironment } from "./utils";

const walletPrivateKey = process.env.DEVNET_PRIVKEY;
const l1Provider = new providers.JsonRpcProvider(process.env.L1RPC);
const l2Provider = new providers.JsonRpcProvider(process.env.L2RPC);
// const l1Wallet = new Wallet(walletPrivateKey, l1Provider);

/**
 * For the purpose of our tests, here we deploy an standard ERC20 token (L1Token) to L1
 * It sends its deployer (us) the initial supply of 1000
 */
const main = async () => {
  /**
   * Use l2Network to get the token bridge addresses needed to deploy the token
   */
  const l2Network = await getL2Network(l2Provider);

  const l1Gateway = l2Network.tokenBridge.l1CustomGateway;
  const l1Router = l2Network.tokenBridge.l1GatewayRouter;

  /**
   * Deploy our custom token smart contract to L1
   * We give the custom token contract the address of l1CustomGateway and l1GatewayRouter as well as the initial supply (premine)
   */
  console.log("Deploying the test L1Token to L1:");

  const EthYBR = (await ethers.getContractFactory("EthYBR")) as EthYBR__factory;
  const ethYBR = await upgrades.deployProxy(EthYBR, [environment.EthMultisig, l1Gateway, l1Router], {
    initializer: "initialize",
    redeployImplementation: "never",
    salt: "EthYBR",
    initialOwner: environment.EthMultisig,
  });

  console.log(`EthYBR is deployed to L1 at ${await ethYBR.getAddress()}`);

  /**
   * Get the deployer token balance
   */
  const tokenBalance = await l1Token.balanceOf(l1Wallet.address);
  console.log(`Initial token balance of deployer: ${tokenBalance}`);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
