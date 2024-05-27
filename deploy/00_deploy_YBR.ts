import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer, multisig } = await getNamedAccounts();

  const res = await deploy("YBR", {
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

  console.log(res);
};
export default func;
func.tags = ["YBR"];
