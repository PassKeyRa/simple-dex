// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const DEX = await hre.ethers.getContractFactory("DEX");
  const dex = await DEX.deploy();

  const ERC20Mock = await hre.ethers.getContractFactory("ERC20Mock");
  const dai = await ERC20Mock.deploy("DAI stablecoin", "DAI");
  const mtk = await ERC20Mock.deploy("My Token", "MTK");
  const atk = await ERC20Mock.deploy("Any Token", "ATK");

  await dex.deployed();
  await dai.deployed();
  await mtk.deployed();
  await atk.deployed();

  console.log(`DEX deployed at ${dex.address}`);
  console.log(`DAI deployed at ${dai.address}`);
  console.log(`MTK deployed at ${mtk.address}`);
  console.log(`ATK deployed at ${atk.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
