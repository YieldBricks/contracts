module.exports = {
  skipContracts: ["Compliance.sol", "SaleManager.sol", "Property.sol", "test"],
  skipTests: [
    "Compliance.ts",
    "SaleManager.ts",
    "Property.ts",
    "System.ts",
    "YBR.gas.ts",
    // "YBR.ts",
  ],
  testingTimeOutInSec: 300,
  network: "none",
  testingFramework: "hardhat",
  minimal: true,
  tce: false,
};
