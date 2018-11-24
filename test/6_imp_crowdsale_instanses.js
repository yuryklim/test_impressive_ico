const IMP_Token = artifacts.require('./IMP_Token.sol');
const IMP_Crowdsale = artifacts.require('./IMP_Crowdsale.sol');

let IMP_CrowdsaleSharedLedger = artifacts.require("IMP_CrowdsaleSharedLedger");

const Reverter = require('./helpers/reverter');
const IncreaseTime = require('./helpers/increaseTime');
const expectThrow = require('./helpers/expectThrow');
const MockToken = require('./helpers/MockToken');
const MockCrowdsale = require('./helpers/MockCrowdsale');

var BigNumber = require('bignumber.js');

contract("IMP_Crowdsale - test preICO purchase limits", (accounts) => {
  const ACC_1 = accounts[1];
  const ACC_2 = accounts[2];
 
  let tokenLocal;
  let crowdsaleSharedLedger;
  let crowdsaleLocal;
  
  before('setup', async () => {
    const CROWDSALE_WALLET = accounts[4];
    const CROWDSALE_OPENING = web3.eth.getBlock('latest').timestamp + IncreaseTime.duration.days(2);
    const CROWDSALE_CLOSING = CROWDSALE_OPENING + IncreaseTime.duration.days(1);
    
    let mockToken = MockToken.getMock();
    let mockCrowdsale = MockCrowdsale.getMock();
    
    tokenLocal = await IMP_Token.new(mockToken.tokenName, mockToken.tokenSymbol, mockToken.tokenDecimals);
    
    crowdsaleSharedLedger = await IMP_CrowdsaleSharedLedger.new(tokenLocal.address, mockCrowdsale.crowdsaleTotalSupplyLimit, [mockCrowdsale.tokenPercentageReservedPreICO, mockCrowdsale.tokenPercentageReservedICO, mockCrowdsale.tokenPercentageReservedTeam, mockCrowdsale.tokenPercentageReservedPlatform, mockCrowdsale.tokenPercentageReservedAirdrops]);
    
    crowdsaleLocal = await IMP_Crowdsale.new(tokenLocal.address, crowdsaleSharedLedger.address, CROWDSALE_WALLET, [CROWDSALE_OPENING, CROWDSALE_CLOSING], 200000);
    
    await tokenLocal.transferOwnership(crowdsaleLocal.address);
    
    IncreaseTime.increaseTimeTo(CROWDSALE_OPENING + IncreaseTime.duration.minutes(1));
    
    await Reverter.snapshot();
  });
  
  afterEach('revert', async () => {
    await Reverter.revert();
  });
  
  describe("validate token mint limits", () => {
    it("should validate can not mint more tnan preICO limit", async () => {
      
      let maxTokens = new BigNumber(await crowdsaleLocal.tokenLimitReserved_purchase.call()).toNumber();

      await crowdsaleLocal.addAddressesToWhitelist([ACC_1, ACC_2]);
      
      await crowdsaleLocal.sendTransaction({
        from: ACC_1,
        value: web3.toWei(90, 'ether') //  == 180 000 0000 tokens
      });
     
      // let freeForPurchase = await crowdsaleLocal.tokensAvailableToMint_purchase.call();
      // console.log("freeForPurchase: ", freeForPurchase.toFixed());
      await crowdsaleLocal.sendTransaction({
        from: ACC_2,
        value: web3.toWei(45, 'ether') //  == 90 000 0000 tokens
      });
      
      // freeForPurchase = await crowdsaleLocal.tokensAvailableToMint_purchase.call();
      // console.log("freeForPurchase: ", freeForPurchase.toFixed());
      await expectThrow(crowdsaleLocal.sendTransaction({
        from: ACC_2,
        value: web3.toWei(30, 'ether') //  == 90 000 0000 tokens
      }), "should throw, because exceeds maximum limit");
    });
  });
});

contract("IMP_Crowdsale - test finalization", (accounts) => {
  const ACC_1 = accounts[1];
  const ACC_2 = accounts[2];

  let tokenLocal;
  let crowdsaleSharedLedgerLocal;
  let crowdsaleLocal;

  before('setup', async () => {
    const CROWDSALE_WALLET = accounts[4];
    const CROWDSALE_OPENING = web3.eth.getBlock('latest').timestamp + IncreaseTime.duration.days(13);
    const CROWDSALE_CLOSING = CROWDSALE_OPENING + IncreaseTime.duration.days(1);

    let mockToken = MockToken.getMock();
    let mockCrowdsale = MockCrowdsale.getMock();

    tokenLocal = await IMP_Token.new(mockToken.tokenName, mockToken.tokenSymbol, mockToken.tokenDecimals);
    crowdsaleSharedLedgerLocal = await IMP_CrowdsaleSharedLedger.new(tokenLocal.address, mockCrowdsale.crowdsaleTotalSupplyLimit, [mockCrowdsale.tokenPercentageReservedPreICO, mockCrowdsale.tokenPercentageReservedICO, mockCrowdsale.tokenPercentageReservedTeam, mockCrowdsale.tokenPercentageReservedPlatform, mockCrowdsale.tokenPercentageReservedAirdrops]);
    crowdsaleLocal = await IMP_Crowdsale.new(tokenLocal.address, crowdsaleSharedLedgerLocal.address, CROWDSALE_WALLET, [CROWDSALE_OPENING, CROWDSALE_CLOSING], mockCrowdsale.crowdsaleRateEth);

    await crowdsaleSharedLedgerLocal.transferOwnership(crowdsaleLocal.address);
    await tokenLocal.transferOwnership(crowdsaleLocal.address);

    IncreaseTime.increaseTimeTo(CROWDSALE_OPENING);
    
    await Reverter.snapshot();
  });

  afterEach('revert', async () => {
    await Reverter.revert();
  });

  describe("validate finalize function call allowance", () => {
    it("should validate finalize can be called after crowdsale finished by owner only", async () => {
      await expectThrow(crowdsaleLocal.finalize(), "should not allow finalize crowdsale because crowdsale still running");

      let closing = new BigNumber(await crowdsaleLocal.closingTime.call());
      await IncreaseTime.increaseTimeTo(closing.plus(IncreaseTime.duration.minutes(1)));

      await expectThrow(crowdsaleLocal.finalize({
        from: ACC_1
      }), "should throw, because only owner can finalize");

      let finalizePreICOTx = await crowdsaleLocal.finalize();
      //  event
      let logs = finalizePreICOTx.logs;
      assert.equal(logs.length, 3, "finalizePreICOTx should have 3 events");
      let finalizeEvent = logs[2];
      let finalizeEventName = finalizeEvent.event;
      assert.equal(finalizeEventName, "FinalizedWithResults");

      await assert.equal(await crowdsaleSharedLedgerLocal.owner.call(), accounts[0], "wrong owner of crowdsaleSharedLedger after finalization");
      await assert.equal(web3.eth.getCode(crowdsaleLocal.address), 0, "crowdsaleLocal should not exist");

      //  new contract for ICO
      const CROWDSALE_WALLET = accounts[4];
      const CROWDSALE_OPENING = web3.eth.getBlock('latest').timestamp + IncreaseTime.duration.days(6);
      const CROWDSALE_CLOSING = CROWDSALE_OPENING + IncreaseTime.duration.days(1);
      let mockCrowdsale = MockCrowdsale.getMock();

      crowdsaleLocal = await IMP_Crowdsale.new(tokenLocal.address, crowdsaleSharedLedgerLocal.address, CROWDSALE_WALLET, [CROWDSALE_OPENING, CROWDSALE_CLOSING], mockCrowdsale.crowdsaleRateEth);

      await crowdsaleSharedLedgerLocal.transferOwnership(crowdsaleLocal.address);
      await tokenLocal.transferOwnership(crowdsaleLocal.address);

      await IncreaseTime.increaseTimeTo(CROWDSALE_CLOSING + IncreaseTime.duration.minutes(1));
      await crowdsaleLocal.finalize();

      await assert.equal(web3.eth.getCode(crowdsaleLocal.address), 0, "crowdsaleLocal should not exist after ICO finalized");
      await assert.equal(web3.eth.getCode(crowdsaleSharedLedgerLocal.address), 0, "crowdsaleSharedLedgerLocal should not exist after ICO finalized");
    });
  });
});

contract("IMP_Crowdsale - test finalization calculations", (accounts) => {
  const ACC_1 = accounts[1];
  const ACC_2 = accounts[2];

  let tokenLocal;
  let crowdsaleSharedLedgerLocal;
  let crowdsaleLocal;

  before('setup', async () => {
    const CROWDSALE_WALLET = accounts[4];
    const CROWDSALE_OPENING = web3.eth.getBlock('latest').timestamp + IncreaseTime.duration.days(13);
    const CROWDSALE_CLOSING = CROWDSALE_OPENING + IncreaseTime.duration.days(1);

    let mockToken = MockToken.getMock();
    let mockCrowdsale = MockCrowdsale.getMock();

    tokenLocal = await IMP_Token.new(mockToken.tokenName, mockToken.tokenSymbol, mockToken.tokenDecimals);
    crowdsaleSharedLedgerLocal = await IMP_CrowdsaleSharedLedger.new(tokenLocal.address, mockCrowdsale.crowdsaleTotalSupplyLimit, [mockCrowdsale.tokenPercentageReservedPreICO, mockCrowdsale.tokenPercentageReservedICO, mockCrowdsale.tokenPercentageReservedTeam, mockCrowdsale.tokenPercentageReservedPlatform, mockCrowdsale.tokenPercentageReservedAirdrops]);
    crowdsaleLocal = await IMP_Crowdsale.new(tokenLocal.address, crowdsaleSharedLedgerLocal.address, CROWDSALE_WALLET, [CROWDSALE_OPENING, CROWDSALE_CLOSING], mockCrowdsale.crowdsaleRateEth);

    await crowdsaleSharedLedgerLocal.transferOwnership(crowdsaleLocal.address);
    await tokenLocal.transferOwnership(crowdsaleLocal.address);

    IncreaseTime.increaseTimeTo(CROWDSALE_OPENING);
    await Reverter.snapshot();
  });

  afterEach('revert', async () => {
    await Reverter.revert();
  });

  describe("validate finalize function", () => {
    it("should validate limits are being recalculated after finalization", async () => {
      await crowdsaleLocal.addAddressesToWhitelist([ACC_1, ACC_2]);

      //  1. purchase
      await crowdsaleLocal.sendTransaction({
        from: ACC_1,
        value: web3.toWei(90, 'ether') //  == 180 000 0000 tokens
      });

      //  2. team
      const teamSent = new BigNumber(50000000); //  5000
      await crowdsaleLocal.manualMint_team(ACC_2, teamSent.toNumber());


      //  3. platform
      const platformSent = new BigNumber(40000000); //  4000
      await crowdsaleLocal.manualMint_platform(ACC_2, platformSent.toNumber());


      //  4. airdrops
      const airdropsSent = new BigNumber(30000000); //  3000
      await crowdsaleLocal.manualMint_airdrops(ACC_2, airdropsSent.toNumber());

      let unspentPurchase = new BigNumber(await crowdsaleLocal.tokensAvailableToMint_purchase.call()); //  currently preICO
      let unspentTeam = new BigNumber(await crowdsaleLocal.tokensAvailableToMint_team.call());
      let unspentPlatform = new BigNumber(await crowdsaleLocal.tokensAvailableToMint_platform.call());
      let unspentAirdrops = new BigNumber(await crowdsaleLocal.tokensAvailableToMint_airdrops.call());
      let unspentPurchase_ICO = new BigNumber(await crowdsaleSharedLedgerLocal.tokenLimitReserved_ico.call());
      // console.log("unspentPurchase: ", unspentPurchase.toNumber());
      // console.log("unspentTeam: ", unspentTeam.toNumber());
      // console.log("unspentPlatform: ", unspentPlatform.toNumber());
      // console.log("unspentAirdrops: ", unspentAirdrops.toNumber());
      // console.log("unspentPurchase_ICO: ", unspentPurchase_ICO.toNumber());

      let closing = new BigNumber(await crowdsaleLocal.closingTime.call());
      await IncreaseTime.increaseTimeTo(closing.plus(IncreaseTime.duration.minutes(1)));
      let finalizePreICOTx = await crowdsaleLocal.finalize();

      //  event
      let logs = finalizePreICOTx.logs;
      assert.equal(logs.length, 3, "finalizePreICOTx should have 3 events");
      let finalizeEvent = logs[2];
      let finalizeEventName = finalizeEvent.event;
      assert.equal(finalizeEventName, "FinalizedWithResults");

      //  new contract for ICO
      const CROWDSALE_WALLET = accounts[4];
      const CROWDSALE_OPENING = web3.eth.getBlock('latest').timestamp + IncreaseTime.duration.minutes(3);
      const CROWDSALE_CLOSING = CROWDSALE_OPENING + IncreaseTime.duration.days(1);
      let mockCrowdsale = MockCrowdsale.getMock();

      crowdsaleLocal = await IMP_Crowdsale.new(tokenLocal.address, crowdsaleSharedLedgerLocal.address, CROWDSALE_WALLET, [CROWDSALE_OPENING, CROWDSALE_CLOSING], mockCrowdsale.crowdsaleRateEth);

      await crowdsaleSharedLedgerLocal.transferOwnership(crowdsaleLocal.address);
      await tokenLocal.transferOwnership(crowdsaleLocal.address);

      let unspentPurchaseUpdated = new BigNumber(await crowdsaleLocal.tokensAvailableToMint_purchase.call());
      let unspentTeamUpdated = new BigNumber(await crowdsaleLocal.tokensAvailableToMint_team.call());
      let unspentPlatformUpdated = new BigNumber(await crowdsaleLocal.tokensAvailableToMint_platform.call());
      let unspentAirdropsUpdated = new BigNumber(await crowdsaleLocal.tokensAvailableToMint_airdrops.call());
      // console.log("\n\n\nunspentPurchaseUpdated: ", unspentPurchaseUpdated.toNumber());
      // console.log("unspentTeamUpdated: ", unspentTeamUpdated.toNumber());
      // console.log("unspentPlatformUpdated: ", unspentPlatformUpdated.toNumber());
      // console.log("unspentAirdropsUpdated: ", unspentAirdropsUpdated.toNumber());

      //  test ICO values
      assert.equal(unspentPurchaseUpdated.toNumber(), unspentPurchase_ICO.plus(unspentPurchase).toNumber(), "wrong token purchase limit for ICO");
      assert.equal(unspentTeamUpdated.toNumber(), unspentTeam.toNumber(), "wrong token purchase limit for team");
      assert.equal(unspentPlatformUpdated.toNumber(), unspentPlatform.toNumber(), "wrong token purchase limit for platform");
      assert.equal(unspentAirdropsUpdated.toNumber(), unspentAirdrops.toNumber(), "wrong token purchase limit for airdrops");
    });
  });
});
contract("IMP_Crowdsale - ICO minting limits", (accounts) => {
  const ACC_1 = accounts[1];
  const ACC_2 = accounts[2];
  
  let tokenLocal;
  let crowdsaleSharedLedgerLocal;
  let crowdsaleLocal;
  
  before('setup', async () => {
    const CROWDSALE_WALLET = accounts[4];
    const CROWDSALE_OPENING = web3.eth.getBlock('latest').timestamp + IncreaseTime.duration.days(15);
    const CROWDSALE_CLOSING = CROWDSALE_OPENING + IncreaseTime.duration.days(1);
    
    let mockToken = MockToken.getMock();
    let mockCrowdsale = MockCrowdsale.getMock();
    
    tokenLocal = await IMP_Token.new(mockToken.tokenName, mockToken.tokenSymbol, mockToken.tokenDecimals);
    
    crowdsaleSharedLedgerLocal = await IMP_CrowdsaleSharedLedger.new(tokenLocal.address, mockCrowdsale.crowdsaleTotalSupplyLimit, [mockCrowdsale.tokenPercentageReservedPreICO, mockCrowdsale.tokenPercentageReservedICO, mockCrowdsale.tokenPercentageReservedTeam, mockCrowdsale.tokenPercentageReservedPlatform, mockCrowdsale.tokenPercentageReservedAirdrops]);
    
    crowdsaleLocal = await IMP_Crowdsale.new(tokenLocal.address, crowdsaleSharedLedgerLocal.address, CROWDSALE_WALLET, [CROWDSALE_OPENING, CROWDSALE_CLOSING], mockCrowdsale.crowdsaleRateEth);
    
    await crowdsaleSharedLedgerLocal.transferOwnership(crowdsaleLocal.address);
    await tokenLocal.transferOwnership(crowdsaleLocal.address);
    
    IncreaseTime.increaseTimeTo(CROWDSALE_CLOSING + IncreaseTime.duration.seconds(1));
    
    await Reverter.snapshot();
  });
  
  afterEach('revert', async () => {
    await Reverter.revert();
  });
  
  describe("validate correct calculations while ICO minting", () => {
    
    const ONE_FULL_TOKEN = 10000;

    it("should decrease ICO", async () => {
      //  finalize preICO and move to ICO period
      await crowdsaleLocal.finalize();
      
      //  new contract for ICO
      const CROWDSALE_WALLET = accounts[4];
      const CROWDSALE_OPENING = web3.eth.getBlock('latest').timestamp + IncreaseTime.duration.minutes(3);
      const CROWDSALE_CLOSING = CROWDSALE_OPENING + IncreaseTime.duration.days(1);
      
      let mockCrowdsale = MockCrowdsale.getMock();
      
      crowdsaleLocal = await IMP_Crowdsale.new(tokenLocal.address, crowdsaleSharedLedgerLocal.address, CROWDSALE_WALLET, [CROWDSALE_OPENING, CROWDSALE_CLOSING], mockCrowdsale.crowdsaleRateEth);
      
      await crowdsaleSharedLedgerLocal.transferOwnership(crowdsaleLocal.address);
      await tokenLocal.transferOwnership(crowdsaleLocal.address);
      
      IncreaseTime.increaseTimeTo(CROWDSALE_OPENING);
      
      await crowdsaleLocal.addAddressesToWhitelist([ACC_1, ACC_2]);
      
      let tokensAvailableToMint_purchase = new BigNumber(await crowdsaleLocal.tokensAvailableToMint_purchase.call());
      let tokensMinted_purchase = new BigNumber(await crowdsaleLocal.tokensMinted_purchase.call());
      
      await crowdsaleLocal.sendTransaction({
        from: ACC_1,
        value: web3.toWei(0.5, "ether")
      });
      
      let tokensAvailableToMint_purchase_after = new BigNumber(await crowdsaleLocal.tokensAvailableToMint_purchase.call());
      let tokensMinted_purchase_after = new BigNumber(await crowdsaleLocal.tokensMinted_purchase.call());
      let tokensAvailableToMint_purchase_diff = tokensAvailableToMint_purchase.minus(tokensAvailableToMint_purchase_after).toNumber();
      let tokensMinted_purchase_diff = tokensMinted_purchase_after.minus(tokensMinted_purchase).toNumber();
      
      assert.equal(tokensAvailableToMint_purchase_diff, 1000000, "wrong decrease value for tokensAvailableToMint_ICO");
      
      assert.equal(tokensMinted_purchase_diff, tokensAvailableToMint_purchase_diff, "tokensAvailableToMint_purchase_diff should be equal to tokensMinted_purchase_diff");
      
      //  test manual mintings
      let tokensMinted_team = new BigNumber(await crowdsaleLocal.tokensMinted_team.call());
      
      await crowdsaleLocal.manualMint_team(ACC_1, ONE_FULL_TOKEN * 2);
      
      let tokensMinted_team_after = new BigNumber(await crowdsaleLocal.tokensMinted_team.call());
      let tokensMinted_team_Diff = tokensMinted_team_after.minus(tokensMinted_team).toNumber();
      
      assert.equal(tokensMinted_team_Diff, 20000, "wrong tokensMinted_team");
      
      let tokensMinted_platform = new BigNumber(await crowdsaleLocal.tokensMinted_platform.call());
      
      await crowdsaleLocal.manualMint_platform(ACC_1, ONE_FULL_TOKEN);
      
      let tokensMinted_platform_after = new BigNumber(await crowdsaleLocal.tokensMinted_platform.call());
      let tokensMinted_platform_Diff = tokensMinted_platform_after.minus(tokensMinted_platform).toNumber();
      
      assert.equal(tokensMinted_platform_Diff, 10000, "wrong tokensMinted_platform");
      
      let tokensMinted_airdrops = new BigNumber(await crowdsaleLocal.tokensMinted_airdrops.call());
      
      await crowdsaleLocal.manualMint_airdrops(ACC_1, ONE_FULL_TOKEN);
      
      let tokensMinted_airdrops_after = new BigNumber(await crowdsaleLocal.tokensMinted_airdrops.call());
      let tokensMinted_airdrops_Diff = tokensMinted_airdrops_after.minus(tokensMinted_airdrops).toNumber();
      
      assert.equal(tokensMinted_airdrops_Diff, 10000, "wrong tokensMinted_airdrops");
    });
  });
}); 
