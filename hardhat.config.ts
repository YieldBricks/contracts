import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "hardhat-tracer";
import type { HardhatUserConfig } from "hardhat/config";
import { vars } from "hardhat/config";
import { NetworkUserConfig } from "hardhat/types";
import "solidity-docgen";

import "./tasks/accounts";

// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

// Run 'npx hardhat vars setup' to see the list of variables that need to be set

const mnemonic: string = vars.get("MNEMONIC");
const infuraApiKey: string = vars.get("INFURA_API_KEY");

const MOCK_PK = "0x988e312fc974905f7a07ab29a867d4f32ced3e8fc296abfdf4ef430ac4ae91d2";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || MOCK_PK;

export const chainIds = {
  "arbitrum-mainnet": 42161,
  "arbitrum-sepolia": 421614,
  tenderly: 4216100,
  avalanche: 43114,
  bsc: 56,
  ganache: 1337,
  hardhat: 31337,
  mainnet: 1,
  "optimism-mainnet": 10,
  "polygon-mainnet": 137,
  "polygon-mumbai": 80001,
  sepolia: 11155111,
};

export function getChainConfig(chain: keyof typeof chainIds): NetworkUserConfig {
  let jsonRpcUrl: string;
  switch (chain) {
    case "avalanche":
      jsonRpcUrl = "https://api.avax.network/ext/bc/C/rpc";
      break;
    case "bsc":
      jsonRpcUrl = "https://bsc-dataseed1.binance.org";
      break;
    default:
      jsonRpcUrl = "https://" + chain + ".infura.io/v3/" + infuraApiKey;
  }
  return {
    accounts: {
      count: 10,
      mnemonic,
      path: "m/44'/60'/0'/0",
    },
    chainId: chainIds[chain],
    url: jsonRpcUrl,
  };
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  defender: {
    apiKey: process.env.DEFENDER_KEY as string,
    apiSecret: process.env.DEFENDER_SECRET as string,
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY!,
      arbitrumOne: process.env.ARBISCAN_API_KEY!,
    },
  },
  namedAccounts: {
    deployer: 0,
    multisig: "0xC4116De72f8e038A67656860EEe4322d0289598e",
  },
  sourcify: {
    enabled: true,
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
    reportPureAndViewMethods: true,
  },
  docgen: {
    outputDir: "./docs",
    templates: "docs-templates",
    pages: "files",
    exclude: ["test"],
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic,
      },
      chainId: chainIds.hardhat,
    },
    ganache: {
      accounts: {
        mnemonic,
      },
      chainId: chainIds.ganache,
      url: "http://localhost:8545",
    },
    arbitrum: {
      ...getChainConfig("arbitrum-mainnet"),
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    arbitrumSepolia: {
      ...getChainConfig("arbitrum-sepolia"),
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    tenderly: {
      url: "https://virtual.arbitrum.rpc.tenderly.co/c93dc5b9-4ea4-4f46-8d50-5aa6d311f1bd",
      chainId: chainIds.tenderly,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    avalanche: getChainConfig("avalanche"),
    bsc: getChainConfig("bsc"),
    mainnet: { ...getChainConfig("mainnet"), accounts: [DEPLOYER_PRIVATE_KEY] },
    optimism: getChainConfig("optimism-mainnet"),
    "polygon-mainnet": getChainConfig("polygon-mainnet"),
    "polygon-mumbai": getChainConfig("polygon-mumbai"),
    sepolia: {
      ...getChainConfig("sepolia"),
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    "arbitrum-sepolia": {
      ...getChainConfig("arbitrum-sepolia"),
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.20",
    settings: {
      metadata: {
        bytecodeHash: "none",
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
    },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
};

export default config;
