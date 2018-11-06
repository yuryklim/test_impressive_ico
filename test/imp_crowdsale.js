let IMP_Crowdsale = artifacts.require("IMP_Crowdsale.sol");
const expectThrow = require('./helpers/expectThrow');
const Reverter = require('./helpers/reverter');
const BigNumber = require("bignumber.js");

let crowdsale;

contract("IMP_Crowdsale", (accounts) => {

  const OWNER = accounts[0];
  const ACC_1 = accounts[1];

  before("setup", async () => {
    crowdsale = await IMP_Crowdsale.deployed();
    await Reverter.snapshot();
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

    it("shoould validate amounts from percents", async () => {
      let totalSupply = new BigNumber(await crowdsale.tokenLimitTotalSupply_crowdsale.call());
      let percents_preICO = new BigNumber(await crowdsale.tokenPercentageReserved_preICO.call());
      let tokens_preICO = totalSupply.dividedBy(100).multipliedBy(percents_preICO).toNumber();

      assert.equal(tokens_preICO, 300000000000, "wrong percentage for preICO");

      let percents_ico = new BigNumber(await crowdsale.tokenPercentageReserved_ico.call());
      let tokens_ico = totalSupply.dividedBy(100).multipliedBy(percents_ico).toNumber();

      assert.equal(tokens_ico, 440000000000, "wrong percentage for ico");

      let percents_team = new BigNumber(await crowdsale.tokenPercentageReserved_team.call());
      let tokens_team = totalSupply.dividedBy(100).multipliedBy(percents_team).toNumber();

      assert.equal(tokens_team, 180000000000, "wrong percentage for team");

      let percents_platform = new BigNumber(await crowdsale.tokenPercentageReserved_platform.call());
      let tokens_platform = totalSupply.dividedBy(100).multipliedBy(percents_platform).toNumber();

      assert.equal(tokens_platform, 50000000000, "wrong percentage for platform");

      let percents_airdrops = new BigNumber(await crowdsale.tokenPercentageReserved_airdrops.call());
      let tokens_airdrops = totalSupply.dividedBy(100).multipliedBy(percents_airdrops).toNumber();
      
      assert.equal(tokens_airdrops, 20000000000, "wrong percentage for airdrops");
    });
  });

  describe("tokensAvailableToMint_ for diff purposes methods", () => {
  });
}); 
