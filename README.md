# Simple DEX

* Alexey Posikera

* Ksenia Kudasheva

This is a Simple DEX implementation project for the Inno Blockchain course. You can find the frontend hosted here: http://revbase.tk:8888/ (if still hosted)

## Usage

### ./dex

This directory contains the hardhat project with all Solidity contracts. The contracts are placed in `./dex/contracts`. Run the following commands to install all dependencies and execute tests:

```
yarn
npx hardhat test test/DEX.js
```

To deploy the contracts to BSC testnet create .env with `SECRET=<private key>` and run `npx hardhat run --network bsc_testnet scripts/deploy.js`

Currently the contracts are deployed at the following addresses in BSC testnet:

```
DEX deployed at 0xF1115c997DDbed20866932B095E7271b234fc1FB
DAI deployed at 0x924E1413f6093FB833DE4c446eb41eF09CB54Bdd
MTK deployed at 0x0ab8386c436612866Da9804f60Bb15FA14257746
ATK deployed at 0x03E8e11732669A1051a5496e1ca4e83Bf605Df50 
```

### ./front

This is the directory with frontend part. You can run it with:

```
cd ./front
yarn
node index.js
```

Or using docker:

```
docker build -t simple-dex .
docker run -d -p 8888:8888 simple-dex
```

After that, go to `http://<ip>:8888/` and use the DEX!

## Features

* Supports 2 types of orders - limit orders and market orders

* Supports floating-point prices in pair orders by using decimals parameter

* Has a lot of events that can be used for easy orders monitoring

* Secure and optimized Solidity code

## Used tools and frameworks

* Hardhat development environment for smart contracts testing and deployment
* Binanace Smart Chain (BSC) testnet
* NodeJS
* Pure HTML, CSS
* Docker for frontend deployment
* 1 sleepless night
