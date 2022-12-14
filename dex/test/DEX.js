const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("DEX", function () {
  async function deployDEX() {
    const [owner, user1, user2] = await ethers.getSigners();
    const DEX = await ethers.getContractFactory("DEX");
    const dex = await DEX.deploy();

    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    const dai = await ERC20Mock.deploy("DAI stablecoin", "DAI");
    const mtk = await ERC20Mock.deploy("My Token", "MTK");
    const atk = await ERC20Mock.deploy("Any Token", "ATK");
    
    await dai.mint(owner.address, "1000000");
    await dai.mint(user1.address, "1000000");
    await dai.mint(user2.address, "1000000");

    await mtk.mint(user1.address, "1000000");
    await atk.mint(user2.address, "1000000");

    return { owner, user1, user2, dex, dai, mtk, atk};
  }

  describe("Owner and user functions", function () {
    it("Should add new pair MTKDAI and delete it", async function() {
      const { dex, mtk, dai } = await loadFixture(deployDEX);
      await dex.addPair("MTKDAI", mtk.address, dai.address, "4");
      var pairs = await dex.fetchPairs();
      expect(pairs[0]).to.equal('MTKDAI');
      await dex.deletePair("MTKDAI");
      pairs = await dex.fetchPairs();
      await expect(pairs.length).to.equal(0);
    });

    it("Should deposit 1000 MTK from user1 and withdraw", async function() {
      const { dex, mtk, dai, user1 } = await loadFixture(deployDEX);
      await dai.connect(user1).approve(dex.address, "1000");

      await expect(dex.connect(user1).deposit(dai.address, "1000")).to.be.reverted;

      await dex.addPair("MTKDAI", mtk.address, dai.address, "4");
      await dex.connect(user1).deposit(dai.address, "1000");
      var balance = await dex.connect(user1).balanceOf(dai.address);
      await expect(balance).to.equal(1000);
      await dex.connect(user1).withdraw(dai.address, "1000");
      var balance = await dex.connect(user1).balanceOf(dai.address);
      await expect(balance).to.equal(0);
    });
  });

  describe("Trade functions", function () {
    beforeEach(async function() {
      const { dex, mtk, dai, atk, user1, user2 } = await loadFixture(deployDEX);
      await dex.addPair("MTKDAI", mtk.address, dai.address, "2");
      await dex.addPair("ATKDAI", atk.address, atk.address, "2");
      await dex.addPair("MTKATK", mtk.address, atk.address, "4");

      await dai.connect(user1).approve(dex.address, "1000000");
      await dai.connect(user2).approve(dex.address, "1000000");
      await mtk.connect(user1).approve(dex.address, "1000000");
      await atk.connect(user2).approve(dex.address, "1000000");
      await dex.connect(user1).deposit(dai.address, "1000000");
      await dex.connect(user2).deposit(dai.address, "1000000");
      await dex.connect(user1).deposit(mtk.address, "1000000");
      await dex.connect(user2).deposit(atk.address, "1000000");
    });

    it("[MTKDAI] user1 creates limit sell order, user2 executes market order", async function() {
      
    });
  });
});
