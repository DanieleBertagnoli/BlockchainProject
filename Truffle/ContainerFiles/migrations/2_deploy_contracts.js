const DragonBlock = artifacts.require("DragonBlock");
const DragonBlockDEMO = artifacts.require("DragonBlockDEMO");
const DragonBlockOracle = artifacts.require("DragonBlockOracle");

module.exports = async function (deployer) {
  // Deploy DragonBlockOracle
  await deployer.deploy(DragonBlockOracle);
  const dragonBlockOracleInstance = await DragonBlockOracle.deployed();

  // Deploy DragonBlock with DragonBlockOracle's address as a constructor argument
  await deployer.deploy(DragonBlock, dragonBlockOracleInstance.address);

  await deployer.deploy(DragonBlockDEMO, dragonBlockOracleInstance.address);
};
