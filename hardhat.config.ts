import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
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

export const chainIds = {
  "arbitrum-mainnet": 42161,
  "arbitrum-sepolia": 421614,
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
      arbitrumOne: vars.get("ARBISCAN_API_KEY", ""),
    },
  },
  namedAccounts: {
    deployer: 0,
    multisig: "0xC4116De72f8e038A67656860EEe4322d0289598e",
  },

  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
    src: "./contracts",
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
      verify: {
        etherscan: {
          apiKey: vars.get("ARBISCAN_API_KEY", ""),
        },
      },

      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
    },
    arbitrumSepolia: {
      ...getChainConfig("arbitrum-sepolia"),
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
    },
    avalanche: getChainConfig("avalanche"),
    bsc: getChainConfig("bsc"),
    mainnet: getChainConfig("mainnet"),
    optimism: getChainConfig("optimism-mainnet"),
    "polygon-mainnet": getChainConfig("polygon-mainnet"),
    "polygon-mumbai": getChainConfig("polygon-mumbai"),
    sepolia: {
      ...getChainConfig("sepolia"),
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
    },
    "arbitrum-sepolia": {
      ...getChainConfig("arbitrum-sepolia"),
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
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
