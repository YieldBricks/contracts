import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer, multisig } = await getNamedAccounts();

  await deploy("YBR", {
    contract: "YBR",
    from: deployer,

    proxy: {
      owner: multisig,
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        init: {
          methodName: "initialize",
          args: [multisig],
        },
      },
    },
    log: true,
  });
};
export default func;
func.tags = ["YBR"];
