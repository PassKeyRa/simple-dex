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
      var balance = await dex.connect(user1).balanceOf(dai.address, user1.address);
      await expect(balance).to.equal(1000);
      await dex.connect(user1).withdraw(dai.address, "1000");
      var balance = await dex.connect(user1).balanceOf(dai.address, user1.address);
      await expect(balance).to.equal(0);
    });
  });

  describe("Trade functions", async function () {
    let dex, mtk, dai, atk, user1, user2;
    beforeEach(async function() {
      let data = await loadFixture(deployDEX);
      dex = data.dex; mtk = data.mtk; dai = data.dai;
      atk = data.atk; user1 = data.user1; user2 = data.user2;
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
      // sell 100 MTK by price 33.33 DAI for 1 MTK
      await dex.connect(user1).sellOrderLimit("MTKDAI", "100", "3333");
      var sellOrders = await dex.fetchSellOrders("MTKDAI");
      await expect(sellOrders.length).to.equal(1);
      var order = sellOrders[0];
      await expect(order[0]).to.equal("1");
      await expect(order[1]).to.equal("MTKDAI");
      await expect(order[2]).to.equal("100");
      await expect(order[3]).to.equal("3333");
      await expect(order[4]).to.equal(user1.address);
      await expect(order[5]).to.equal(1);
      await expect((await dex.balanceOf(mtk.address, user1.address))).to.equal("999900");

      // buy 100 MTK buy market price
      await dex.connect(user2).buyOrderMarket("MTKDAI", "100");
      sellOrders = await dex.fetchSellOrders("MTKDAI");
      await expect(sellOrders.length).to.equal(0);
      await expect((await dex.balanceOf(mtk.address, user2.address))).to.equal("100");
      await expect((await dex.balanceOf(dai.address, user2.address))).to.equal("996667");
      await expect((await dex.balanceOf(mtk.address, user1.address))).to.equal("999900");
      await expect((await dex.balanceOf(dai.address, user1.address))).to.equal("1003333");
    });

    it("[MTKATK] user2 creates limit buy order, user1 executes market order", async function() {
      // buy 100 MTK by price 33.6767 ATK for 1 MTK
      await dex.connect(user2).buyOrderLimit("MTKATK", "100", "336767");
      var buyOrders = await dex.fetchBuyOrders("MTKATK");
      await expect(buyOrders.length).to.equal(1);
      var order = buyOrders[0];
      await expect(order[0]).to.equal("1");
      await expect(order[1]).to.equal("MTKATK");
      await expect(order[2]).to.equal("100");
      await expect(order[3]).to.equal("336767");
      await expect(order[4]).to.equal(user2.address);
      await expect(order[5]).to.equal(0);
      await expect((await dex.balanceOf(atk.address, user2.address))).to.equal("996633");

      // sell 100 MTK buy market price
      await dex.connect(user1).sellOrderMarket("MTKATK", "100");
      buyOrders = await dex.fetchBuyOrders("MTKATK");
      await expect(buyOrders.length).to.equal(0);
      await expect((await dex.balanceOf(mtk.address, user1.address))).to.equal("999900");
      await expect((await dex.balanceOf(atk.address, user1.address))).to.equal("3367");
      await expect((await dex.balanceOf(mtk.address, user2.address))).to.equal("100");
      await expect((await dex.balanceOf(atk.address, user2.address))).to.equal("996633");
    });

    it("[MTKATK, MTKDAI] user2 creates 2 orders and deletes them", async function() {
      await dex.connect(user2).buyOrderLimit("MTKATK", "100", "336767");
      await dex.connect(user1).sellOrderLimit("MTKDAI", "100", "3333");
      var ordersMTKATK = await dex.fetchBuyOrders("MTKATK");
      var ordersMTKDAI = await dex.fetchSellOrders("MTKDAI");
      await expect(ordersMTKATK.length).to.equal(1);
      await expect(ordersMTKDAI.length).to.equal(1);
      await dex.connect(user2).deleteOrder(ordersMTKATK[0].id);
      await dex.connect(user1).deleteOrder(ordersMTKDAI[0].id);
      var ordersMTKATK = await dex.fetchBuyOrders("MTKATK");
      var ordersMTKDAI = await dex.fetchSellOrders("MTKDAI");
      await expect(ordersMTKATK.length).to.equal(0);
      await expect(ordersMTKDAI.length).to.equal(0);
    });
  });

  describe("Test multiple orders in a pair", function() {
    beforeEach(async function() {
      let data = await loadFixture(deployDEX);
      dex = data.dex; mtk = data.mtk; dai = data.dai;
      atk = data.atk; user1 = data.user1; user2 = data.user2;
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

      for (var i = 0; i < 10; i++) {
        await dex.connect(user1).sellOrderLimit("MTKDAI", "137", i * 1000 + 1337);
        await dex.connect(user2).buyOrderLimit("MTKDAI", "137", i * 137 + 1337);
        await dex.connect(user1).buyOrderLimit("ATKDAI", "123", i * 13 + 1234);
      }
    });


  });
});
