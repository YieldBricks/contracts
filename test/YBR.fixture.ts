import { ethers, upgrades } from "hardhat";

import { EthYBR, EthYBR__factory, Tiers, Tiers__factory } from "../types";
import { ZERO_ADDRESS } from "./utils";

export async function deployYBRFixture() {
  // Contracts are deployed using the first signer/account by default
  const [deployer, multisig, alice, bob, charlie] = await ethers.getSigners();

  // Deploy YBR contract
  const YBR = (await ethers.getContractFactory("EthYBR")) as EthYBR__factory;
  const YBRProxy = await upgrades.deployProxy(YBR, [multisig.address, ZERO_ADDRESS, ZERO_ADDRESS], {
    unsafeAllow: ["internal-function-storage"],
    initializer: "initialize",
  });
  const ybr = YBR.attach(await YBRProxy.getAddress()) as EthYBR;
  const ybrAddress = await ybr.getAddress();

  const Tiers = (await ethers.getContractFactory("Tiers")) as Tiers__factory;
  const TiersProxy = await upgrades.deployProxy(Tiers, [multisig.address, ybrAddress], {
    unsafeAllow: ["internal-function-storage"],
  });
  const tiers = Tiers.attach(await TiersProxy.getAddress()) as Tiers;
  const tiersAddress = await tiers.getAddress();

  return {
    ybr,
    ybrAddress,
    tiers,
    tiersAddress,
    deployer,
    multisig,
    alice,
    bob,
    charlie,
  };
}
