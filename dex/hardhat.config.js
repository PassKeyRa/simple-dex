require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require('dotenv').config();
const { SECRET } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  networks: {
    bsc_testnet: {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      accounts: [SECRET]
    }
  },
  gasReporter: {
    enabled: false,
  },
};
