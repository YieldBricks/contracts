import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, upgrades } from "hardhat";
import { vars } from "hardhat/config";

import { YieldbricksOracle, YieldbricksOracle__factory } from "../types";

export async function deployOracleFixture() {
  // Contracts are deployed using the first signer/account by default
  const [deployer, multisig, alice, bob, charlie] = await ethers.getSigners();

  // Deploy YBR contract
  const YieldbricksOracle = (await ethers.getContractFactory("YieldbricksOracle")) as YieldbricksOracle__factory;
  const YieldbricksOracleProxy = await upgrades.deployProxy(YieldbricksOracle, [multisig.address], {
    unsafeAllow: ["internal-function-storage"],
    initializer: "initialize",
  });
  const oracle = YieldbricksOracle.attach(await YieldbricksOracleProxy.getAddress()) as YieldbricksOracle;
  const oracleAddress = await oracle.getAddress();

  return {
    oracle,
    oracleAddress,
    deployer,
    multisig,
    alice,
    bob,
    charlie,
  };
}

type FixtureReturnType = Awaited<Promise<PromiseLike<ReturnType<typeof deployOracleFixture>>>>;

const YBR = "0x11920f139a3121c2836E01551D43F95B3c31159c";

describe("Oracle Fork Test", function () {
  this.timeout(600000);

  before(async function () {
    // Fork arbitrum mainnet for test
    await reset(`https://arbitrum-mainnet.infura.io/v3/${vars.get("INFURA_API_KEY")}`);

    this.loadFixture = loadFixture;
  });

  describe("Happy flow", function () {
    before(async function () {
      this.fixture = (await this.loadFixture(deployOracleFixture)) as FixtureReturnType;
    });

    it("Returns correct price for arbitrum", async function () {
      const { oracle } = this.fixture;

      const ret = await oracle.getTokenUSDPrice(YBR);
      console.log(ret);
    });
  });
});
