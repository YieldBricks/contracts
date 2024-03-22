module.exports = {
  buildDir: "",
  contractsDir: "",
  testDir: "",
  skipContracts: [],
  skipTests: [
    "test/Compliance.ts",
    "test/SaleManager.ts",
    "test/Token.ts",
    "test/System.ts",
    "test/YBR.gas.ts",
    // "test/YBR.ts",
  ],
  testingTimeOutInSec: 300,
  network: "none",
  testingFramework: "hardhat",
  minimal: true,
  tce: false,
};
