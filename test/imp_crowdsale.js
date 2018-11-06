let IMP_Crowdsale = artifacts.require("IMP_Crowdsale.sol");
let IMP_Token = artifacts.require("IMP_Token.sol");

const expectThrow = require('./helpers/expectThrow');
const Reverter = require('./helpers/reverter');
const BigNumber = require("bignumber.js");

let crowdsale;
let token;

contract("IMP_Crowdsale", (accounts) => {

  const OWNER = accounts[0];
  const ACC_1 = accounts[1];
  const WALLET = accounts[4];

  const MIN_WEI = 0.00001;

  before("setup", async () => {
    crowdsale = await IMP_Crowdsale.deployed();
    token = await IMP_Token.at(await crowdsale.token.call());
    await Reverter.snapshot();
  });

  beforeEach("add to whitelist", async () => {
    await crowdsale.addAddressToWhitelist(ACC_1);
  });

  afterEach("revert", async () => {
    await Reverter.revert();
  });

  describe("validate initial Crowdsaletype", () => {
    it("should be preICO", async () => {
      assert.equal(new BigNumber(await crowdsale.crowdsaleType.call()).toNumber(), 0, "should be 0 as preICO");
    });
  });

  describe("validate percents and values on start", () => {
    it("should validate percents", async () => {
      assert.equal(new BigNumber(await crowdsale.tokenPercentageReserved_preICO.call()).toNumber(), 30, "wrong percentage for preICO");
      assert.equal(new BigNumber(await crowdsale.tokenPercentageReserved_ico.call()).toNumber(), 44, "wrong percentage for ico");
      assert.equal(new BigNumber(await crowdsale.tokenPercentageReserved_team.call()).toNumber(), 18, "wrong percentage for team");
      assert.equal(new BigNumber(await crowdsale.tokenPercentageReserved_platform.call()).toNumber(), 5, "wrong percentage for platform");
      assert.equal(new BigNumber(await crowdsale.tokenPercentageReserved_airdrops.call()).toNumber(), 2, "wrong percentage for airdrops");
    });

    it.only("shoould validate amounts from percents", async () => {
      let totalSupply = new BigNumber(await crowdsale.tokenLimitTotalSupply_crowdsale.call());

      //  1
      let percents_preICO = new BigNumber(await crowdsale.tokenPercentageReserved_preICO.call());
      let tokens_preICO = totalSupply.dividedBy(100).multipliedBy(percents_preICO).toNumber();

      assert.equal(tokens_preICO, 300000000000, "wrong percentage for preICO");

      let tokensAvailableToMint_preICO = new BigNumber(await crowdsale.tokensAvailableToMint_preICO.call()).toNumber();
      assert.equal(tokensAvailableToMint_preICO, tokens_preICO, "wrong tokensAvailableToMint_preICO");
      
      //  2
      let percents_ico = new BigNumber(await crowdsale.tokenPercentageReserved_ico.call());
      let tokens_ico = totalSupply.dividedBy(100).multipliedBy(percents_ico).toNumber();

      assert.equal(tokens_ico, 440000000000, "wrong percentage for ico");

      let tokensAvailableToMint_ico = new BigNumber(await crowdsale.tokensAvailableToMint_ico.call()).toNumber();
      assert.equal(tokensAvailableToMint_ico, tokens_ico, "wrong tokensAvailableToMint_ico");
      
      //  3
      let percents_team = new BigNumber(await crowdsale.tokenPercentageReserved_team.call());
      let tokens_team = totalSupply.dividedBy(100).multipliedBy(percents_team).toNumber();

      assert.equal(tokens_team, 180000000000, "wrong percentage for team");

      let tokensAvailableToMint_team = new BigNumber(await crowdsale.tokensAvailableToMint_team.call()).toNumber();
      assert.equal(tokensAvailableToMint_team, tokens_team, "wrong tokensAvailableToMint_team");
      
      //  4
      let percents_platform = new BigNumber(await crowdsale.tokenPercentageReserved_platform.call());
      let tokens_platform = totalSupply.dividedBy(100).multipliedBy(percents_platform).toNumber();

      assert.equal(tokens_platform, 50000000000, "wrong percentage for platform");

      let tokensAvailableToMint_platform = new BigNumber(await crowdsale.tokensAvailableToMint_platform.call()).toNumber();
      assert.equal(tokensAvailableToMint_platform, tokens_platform, "wrong tokensAvailableToMint_platform");
      
      //  5
      let percents_airdrops = new BigNumber(await crowdsale.tokenPercentageReserved_airdrops.call());
      let tokens_airdrops = totalSupply.dividedBy(100).multipliedBy(percents_airdrops).toNumber();
      
      assert.equal(tokens_airdrops, 20000000000, "wrong percentage for airdrops");

      let tokensAvailableToMint_airdrops = new BigNumber(await crowdsale.tokensAvailableToMint_airdrops.call()).toNumber();
      assert.equal(tokensAvailableToMint_airdrops, tokens_airdrops, "wrong tokensAvailableToMint_airdrops");
    });
  });

  describe("minimum purchase wei value", async () => {
    const MIN_ETH = 0.00001;
    const MIN_VALUE = web3.toWei(MIN_ETH, "ether");
    it("should reject if minimum purchase wei value not reached", async () => {
      await expectThrow(crowdsale.sendTransaction({
        from: ACC_1,
        value: web3.toWei(MIN_ETH / 10, "ether")
      }), "should revert, because wei value is too low");
    });
    it("should pass if purchase wei value is > minimum", async () => {
      await crowdsale.sendTransaction({
        from: ACC_1,
        value: MIN_VALUE
      });
    });
  });

  describe("correct token amount is being calculated during purchase", () => {
    it("should validate token amount is correct for 1 ETH", async () => {
      await crowdsale.sendTransaction({
        from: ACC_1,
        value: web3.toWei(1, "ether")
      });
      let balance = new BigNumber(await token.balanceOf.call(ACC_1)).toNumber();
      assert.equal(balance, 100000, "wrong balance for 1 ETH");
    });
    it("should validate token amount is correct for two transactions 1 ETH + 0.5 ETH", async () => {
      await crowdsale.sendTransaction({
        from: ACC_1,
        value: web3.toWei(1, "ether")
      });
      await crowdsale.sendTransaction({
        from: ACC_1,
        value: web3.toWei(0.5, "ether")
      });
      let balance = new BigNumber(await token.balanceOf.call(ACC_1)).toNumber();
      assert.equal(balance, 150000, "wrong balance for 2 transactions");
    });
  });

  describe("tokensAvailableToMint_ for diff purposes methods", () => {
  });
}); 
