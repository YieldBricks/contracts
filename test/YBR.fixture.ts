import { ethers, upgrades } from "hardhat";

import { YBR, YBR__factory } from "../types";

export async function deployYBRFixture() {
  // Contracts are deployed using the first signer/account by default
  const [deployer, multisig, alice, bob, charlie] = await ethers.getSigners();

  // Deploy YBR contract
  const YBR = (await ethers.getContractFactory("YBR")) as YBR__factory;
  const YBRProxy = await upgrades.deployProxy(YBR, [multisig.address], { unsafeAllow: ["internal-function-storage"] });
  const ybr = YBR.attach(await YBRProxy.getAddress()) as YBR;
  const ybrAddress = await ybr.getAddress();

  return {
    ybr,
    ybrAddress,
    deployer,
    multisig,
    alice,
    bob,
    charlie,
  };
}
