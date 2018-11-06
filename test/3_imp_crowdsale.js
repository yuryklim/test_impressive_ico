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

    it("shoould validate amounts from percents", async () => {
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

  describe("purchase", async () => {

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

    it("wei should stay on crowdsale contract balance", async () => {
      //  1
      await crowdsale.sendTransaction({
        from: ACC_1,
        value: web3.toWei(1, "ether")
      });
      let balance = new BigNumber(await web3.eth.getBalance(crowdsale.address)).toNumber();
      assert.equal(balance, new BigNumber(web3.toWei(1, "ether")).toNumber(), "wrong contract balance after purchase 1 ETH");
      //  2
      await crowdsale.sendTransaction({
        from: ACC_1,
        value: web3.toWei(2.5, "ether")
      });
      balance = new BigNumber(await web3.eth.getBalance(crowdsale.address)).toNumber();
      assert.equal(balance, new BigNumber(web3.toWei(3.5, "ether")).toNumber(), "wrong contract balance after purchase 2.5 ETH");
    });
  });

  describe("manual transfers", () => {

    const ONE_FULL_TOKEN = 10000;
    
    it("should reject manualMint_ functions if not owner", async () => {
      
      await expectThrow(crowdsale.manualMint_team(ACC_1, ONE_FULL_TOKEN, {
        from: ACC_1
      }), "should not let manualMint_team if not owner");
      
      await expectThrow(crowdsale.manualMint_platform(ACC_1, ONE_FULL_TOKEN, {
        from: ACC_1
      }), "should not let manualMint_platform if not owner");
      
      await expectThrow(crowdsale.manualMint_airdrops(ACC_1, ONE_FULL_TOKEN, {
        from: ACC_1
      }), "should not let manualMint_airdrops if not owner");
    });
    
    it("should validate manualMint_team transfers tokens correctly", async () => {
      
      await crowdsale.manualMint_team(ACC_1, ONE_FULL_TOKEN);
      
      let balance = new BigNumber(await token.balanceOf.call(ACC_1)).toNumber();
     
      assert.equal(balance, ONE_FULL_TOKEN, "wrong tokens after manualMint_team ONE_FULL_TOKEN");
      
      await crowdsale.manualMint_team(ACC_1, ONE_FULL_TOKEN);
      
      balance = new BigNumber(await token.balanceOf.call(ACC_1)).toNumber();
      
      assert.equal(balance, ONE_FULL_TOKEN * 2, "wrong tokens after next manualMint_team ONE_FULL_TOKEN");
    });
    
    it("should validate manualMint_platform transfers tokens correctly", async () => {
      
      await crowdsale.manualMint_platform(ACC_1, ONE_FULL_TOKEN);
      
      let balance = new BigNumber(await token.balanceOf.call(ACC_1)).toNumber();
      
      assert.equal(balance, ONE_FULL_TOKEN, "wrong tokens after manualMint_team ONE_FULL_TOKEN");
      
      await crowdsale.manualMint_platform(ACC_1, ONE_FULL_TOKEN);
      
      balance = new BigNumber(await token.balanceOf.call(ACC_1)).toNumber();
      
      assert.equal(balance, ONE_FULL_TOKEN * 2, "wrong tokens after next manualMint_platform ONE_FULL_TOKEN");
    });
    
    it("should validate manualMint_airdrops transfers tokens correctly", async () => {
      
      await crowdsale.manualMint_airdrops(ACC_1, ONE_FULL_TOKEN);
      
      let balance = new BigNumber(await token.balanceOf.call(ACC_1)).toNumber();
      
      assert.equal(balance, ONE_FULL_TOKEN, "wrong tokens after manualMint_team ONE_FULL_TOKEN");
      
      await crowdsale.manualMint_airdrops(ACC_1, ONE_FULL_TOKEN);
      
      balance = new BigNumber(await token.balanceOf.call(ACC_1)).toNumber();
      
      assert.equal(balance, ONE_FULL_TOKEN * 2, "wrong tokens after next manualMint_airdrops ONE_FULL_TOKEN");
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

    const ONE_FULL_TOKEN = 10000;

    it("should decrease preICO", async () => {

      let tokensAvailableToMint_preICO = new BigNumber(await crowdsale.tokensAvailableToMint_preICO.call());
  
      await crowdsale.sendTransaction({
        from: ACC_1,
        value: web3.toWei(0.5, "ether")
      });

      let tokensAvailableToMint_preICO_after = new BigNumber(await crowdsale.tokensAvailableToMint_preICO.call());
      let diff = tokensAvailableToMint_preICO.minus(tokensAvailableToMint_preICO_after).toNumber();
      
      assert.equal(diff, 50000, "wrong decrease value for tokensAvailableToMint_preICO");

      await crowdsale.tokensAvailableToMint_preICO.call({
        from: ACC_1
      }); //  any user can check
    });

    it("should decrease ico", async () => {
      //  TODO
      await crowdsale.tokensAvailableToMint_ico.call({
        from: ACC_1
      }); //  any user can check
    });

    it("should decrease team", async () => {

      let tokensAvailableToMint_team = new BigNumber(await crowdsale.tokensAvailableToMint_team.call());
      
      await crowdsale.manualMint_team(ACC_1, ONE_FULL_TOKEN);
      
      let tokensAvailableToMint_team_after = new BigNumber(await crowdsale.tokensAvailableToMint_team.call());
      let diff = tokensAvailableToMint_team.minus(tokensAvailableToMint_team_after).toNumber();
      
      assert.equal(diff, 10000, "wrong decrease value for tokensAvailableToMint_team");
      
      await expectThrow(crowdsale.tokensAvailableToMint_team.call({
        from: ACC_1
      }), "should not let anyone check tokensAvailableToMint_team");
    });

    it("should decrease platform", async () => {
      
      let tokensAvailableToMint_platform = new BigNumber(await crowdsale.tokensAvailableToMint_platform.call());
      
      await crowdsale.manualMint_platform(ACC_1, ONE_FULL_TOKEN * 2);
      
      let tokensAvailableToMint_platform_after = new BigNumber(await crowdsale.tokensAvailableToMint_platform.call());
      let diff = tokensAvailableToMint_platform.minus(tokensAvailableToMint_platform_after).toNumber();
      
      assert.equal(diff, 20000, "wrong decrease value for tokensAvailableToMint_platform");
      
      await expectThrow(crowdsale.tokensAvailableToMint_platform.call({
        from: ACC_1
      }), "should not let anyone check tokensAvailableToMint_platform");
    });

    it("should decrease airdrops", async () => {
      
      let tokensAvailableToMint_airdrops = new BigNumber(await crowdsale.tokensAvailableToMint_airdrops.call());
      
      await crowdsale.manualMint_airdrops(ACC_1, ONE_FULL_TOKEN);
      
      let tokensAvailableToMint_airdrops_after = new BigNumber(await crowdsale.tokensAvailableToMint_airdrops.call());
      let diff = tokensAvailableToMint_airdrops.minus(tokensAvailableToMint_airdrops_after).toNumber();
      
      assert.equal(diff, 10000, "wrong decrease value for tokensAvailableToMint_airdrops");
      
      await expectThrow(crowdsale.tokensAvailableToMint_airdrops.call({
        from: ACC_1
      }), "should not let anyone check tokensAvailableToMint_airdrops");
    });
  });

  describe("different functionality", () => {
    it("should validate calculate token function", async () => {
      //  1
      let wei = web3.toWei(0.5, "ether");
      let tokens = new BigNumber(await crowdsale.calculateTokenAmount.call(wei)).toNumber();
      assert.equal(tokens, 50000, "wrong token amount for 0.5 ETH");

      //  2
      wei = web3.toWei(1.5, "ether");
      tokens = new BigNumber(await crowdsale.calculateTokenAmount.call(wei)).toNumber();
      assert.equal(tokens, 150000, "wrong token amount for 1.5 ETH");
    });
  });

  describe("tokensMinted_", () => {

    const ONE_ETH_IN_WEI = web3.toWei(1, "ether");
    const ONE_FULL_TOKEN = 10000;
    
    it("should validate preICO updating", async () => {
    
      let tokensMinted_preICO = new BigNumber(await crowdsale.tokensMinted_preICO.call());
    
      await crowdsale.sendTransaction({
        from: ACC_1,
        value: ONE_ETH_IN_WEI
      });
    
      let tokensMinted_preICO_after = new BigNumber(await crowdsale.tokensMinted_preICO.call());
      let diff = tokensMinted_preICO_after.minus(tokensMinted_preICO).toNumber();
    
      assert.equal(diff, 100000, "wrong tokensMinted_preICO");
    });
    
    it("should validate ico updating", async () => {
      //  TODO
    });
    
    it("should validate team updating", async () => {
    
      let tokensMinted_team = new BigNumber(await crowdsale.tokensMinted_team.call());
    
      await crowdsale.manualMint_team(ACC_1, ONE_FULL_TOKEN * 2);
    
      let tokensMinted_team_after = new BigNumber(await crowdsale.tokensMinted_team.call());
      let diff = tokensMinted_team_after.minus(tokensMinted_team).toNumber();
    
      assert.equal(diff, 20000, "wrong tokensMinted_team");
    });
    
    it("should validate platform updating", async () => {
    
      let tokensMinted_platform = new BigNumber(await crowdsale.tokensMinted_platform.call());
    
      await crowdsale.manualMint_platform(ACC_1, ONE_FULL_TOKEN);
    
      let tokensMinted_platform_after = new BigNumber(await crowdsale.tokensMinted_platform.call());
      let diff = tokensMinted_platform_after.minus(tokensMinted_platform).toNumber();
    
      assert.equal(diff, 10000, "wrong tokensMinted_platform");
    });
    
    it("should validate airdrops updating", async () => {
    
      let tokensMinted_airdrops = new BigNumber(await crowdsale.tokensMinted_airdrops.call());
    
      await crowdsale.manualMint_airdrops(ACC_1, ONE_FULL_TOKEN);
    
      let tokensMinted_airdrops_after = new BigNumber(await crowdsale.tokensMinted_airdrops.call());
      let diff = tokensMinted_airdrops_after.minus(tokensMinted_airdrops).toNumber();
    
      assert.equal(diff, 10000, "wrong tokensMinted_airdrops");
    });
  });

  describe("validate token mint limits", () => {
    
    const ACC_2 = accounts[2];
    
    it("should validate preICO minting limits", async () => {
      let maxTokens = new BigNumber(await crowdsale.tokenLimitReserved_preICO.call()).toNumber();
      console.log(maxTokens);
      //  TODO
    });
    
    it("should validate ICO minting limits", async () => {
      //  TODO
    });
    
    it("should validate team minting limits", async () => {
    
      let maxTokens = new BigNumber(await crowdsale.tokenLimitReserved_team.call()).toNumber();
    
      await expectThrow(crowdsale.manualMint_team(ACC_1, maxTokens + 1), "should not allow mint team tokens more than limit at once");
      
      await crowdsale.manualMint_team(ACC_1, maxTokens - 1);
      
      await crowdsale.manualMint_team(ACC_2, 1);
      
      await expectThrow(crowdsale.manualMint_team(ACC_2, 1), "should not allow mint team tokens more than limit");
    });
    
    it("should validate platform minting limits", async () => {
      
      let maxTokens = new BigNumber(await crowdsale.tokenLimitReserved_platform.call()).toNumber();
      
      await expectThrow(crowdsale.manualMint_platform(ACC_1, maxTokens + 1), "should not allow mint platform tokens more than limit at once");
      
      await crowdsale.manualMint_platform(ACC_1, maxTokens - 1);
      
      await crowdsale.manualMint_platform(ACC_2, 1);
      
      await expectThrow(crowdsale.manualMint_platform(ACC_2, 1), "should not allow mint platform tokens more than limit");
    });
    
    it("should validate airdrops minting limits", async () => {
      
      let maxTokens = new BigNumber(await crowdsale.tokenLimitReserved_airdrops.call()).toNumber();
      
      await expectThrow(crowdsale.manualMint_airdrops(ACC_1, maxTokens + 1), "should not allow mint airdrops tokens more than limit at once");
      
      await crowdsale.manualMint_airdrops(ACC_1, maxTokens - 1);
      
      await crowdsale.manualMint_airdrops(ACC_2, 1);
      
      await expectThrow(crowdsale.manualMint_airdrops(ACC_2, 1), "should not allow mint airdrops tokens more than limit");
    });
  });
}); 
