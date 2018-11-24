const IMP_Token = artifacts.require('./IMP_Token.sol');
const IMP_Crowdsale = artifacts.require('./IMP_Crowdsale.sol');
let IMP_CrowdsaleSharedLedger = artifacts.require("IMP_CrowdsaleSharedLedger");

const Reverter = require('./helpers/reverter');
const IncreaseTime = require('./helpers/increaseTime');
const expectThrow = require('./helpers/expectThrow');
const MockToken = require('./helpers/MockToken');
const MockCrowdsale = require('./helpers/MockCrowdsale');
var BigNumber = require('bignumber.js');

//  TODO: move to discounts test

contract("IMP_Crowdsale - test preICO purchase limits", (accounts) => {
  const ACC_1 = accounts[1];
  const ACC_2 = accounts[2];

  let tokenLocal;
  let crowdsaleSharedLedger;
  let crowdsaleLocal;

  before('setup', async () => {
    const CROWDSALE_WALLET = accounts[4];
    const CROWDSALE_OPENING = web3.eth.getBlock('latest').timestamp + IncreaseTime.duration.days(2);

    let timings = [];
    for (i = 0; i < 7; i++) {
      timings[i] = CROWDSALE_OPENING + IncreaseTime.duration.hours(i);
    }

    let mockToken = MockToken.getMock();
    let mockCrowdsale = MockCrowdsale.getMock();

    tokenLocal = await IMP_Token.new(mockToken.tokenName, mockToken.tokenSymbol, mockToken.tokenDecimals);
    crowdsaleSharedLedger = await IMP_CrowdsaleSharedLedger.new(tokenLocal.address, mockCrowdsale.crowdsaleTotalSupplyLimit, [mockCrowdsale.tokenPercentageReservedPreICO, mockCrowdsale.tokenPercentageReservedICO, mockCrowdsale.tokenPercentageReservedTeam, mockCrowdsale.tokenPercentageReservedPlatform, mockCrowdsale.tokenPercentageReservedAirdrops]);
    crowdsaleLocal = await IMP_Crowdsale.new(tokenLocal.address, crowdsaleSharedLedger.address, CROWDSALE_WALLET, mockCrowdsale.crowdsaleRateEth * 5000, timings, mockCrowdsale.crowdsalePreICODiscounts);
    await tokenLocal.transferOwnership(crowdsaleLocal.address);

    IncreaseTime.increaseTimeTo(CROWDSALE_OPENING + IncreaseTime.duration.minutes(1));

    await Reverter.snapshot();
  });

  afterEach('revert', async () => {
    await Reverter.revert();
  });

  describe("validate token mint limits", () => {
    it("should validate can not mint more tnan preICO limit", async () => {
      //  test ./test/6_imp_crowdsale_instanses.js
      // let maxTokens = new BigNumber(await crowdsaleLocal.tokenLimitReserved_purchase.call()).toNumber();
      // console.log((await crowdsaleLocal.calculateTokenAmount.call(web3.toWei(100, 'ether'))).toNumber());

      await crowdsaleLocal.addAddressesToWhitelist([ACC_1, ACC_2]);

      console.log("freeForPurchase: ", (await crowdsaleLocal.tokensAvailableToMint_purchase.call()).toFixed());
      await crowdsaleLocal.sendTransaction({
        from: ACC_1,
        value: web3.toWei(30, 'ether')
      });
      // console.log("freeForPurchase: ", (await crowdsaleLocal.tokensAvailableToMint_purchase.call()).toFixed());

      await crowdsaleLocal.sendTransaction({
        from: ACC_2,
        value: web3.toWei(20, 'ether')
      });
      // console.log("freeForPurchase: ", (await crowdsaleLocal.tokensAvailableToMint_purchase.call()).toFixed());

      await expectThrow(crowdsaleLocal.sendTransaction({
        from: ACC_2,
        value: web3.toWei(1, 'ether')
      }), "should throw, because exceeds maximum limit");

    });
  });

  //  Note: ICO minitng limits tested in 7_imp_discount_crowdsale.js
});

contract("IMP_Crowdsale - test finalization", (accounts) => {
  const ACC_1 = accounts[1];

  let tokenLocal;
  let crowdsaleSharedLedgerLocal;
  let crowdsaleLocal;

  before('setup', async () => {
    const CROWDSALE_WALLET = accounts[4];
    const CROWDSALE_OPENING = web3.eth.getBlock('latest').timestamp + IncreaseTime.duration.days(4);

    let timings = [];
    for (i = 0; i < 7; i++) {
      timings[i] = CROWDSALE_OPENING + IncreaseTime.duration.hours(i);
    }

    let mockToken = MockToken.getMock();
    let mockCrowdsale = MockCrowdsale.getMock();

    tokenLocal = await IMP_Token.new(mockToken.tokenName, mockToken.tokenSymbol, mockToken.tokenDecimals);
    crowdsaleSharedLedgerLocal = await IMP_CrowdsaleSharedLedger.new(tokenLocal.address, mockCrowdsale.crowdsaleTotalSupplyLimit, [mockCrowdsale.tokenPercentageReservedPreICO, mockCrowdsale.tokenPercentageReservedICO, mockCrowdsale.tokenPercentageReservedTeam, mockCrowdsale.tokenPercentageReservedPlatform, mockCrowdsale.tokenPercentageReservedAirdrops]);
    crowdsaleLocal = await IMP_Crowdsale.new(tokenLocal.address, crowdsaleSharedLedgerLocal.address, CROWDSALE_WALLET, mockCrowdsale.crowdsaleRateEth, timings, mockCrowdsale.crowdsalePreICODiscounts);

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

      await crowdsaleLocal.finalize();

      await assert.equal(await crowdsaleSharedLedgerLocal.owner.call(), accounts[0], "wrong owner of crowdsaleSharedLedger after finalization");
      await assert.equal(web3.eth.getCode(crowdsaleLocal.address), 0, "crowdsaleLocal should not exist");

      //  new contract for ICO
      const CROWDSALE_WALLET = accounts[4];
      const CROWDSALE_OPENING = web3.eth.getBlock('latest').timestamp + IncreaseTime.duration.days(4);

      let timings = [];
      for (i = 0; i < 4; i++) {
        timings[i] = CROWDSALE_OPENING + IncreaseTime.duration.hours(i);
      }

      let mockCrowdsale = MockCrowdsale.getMock();

      crowdsaleLocal = await IMP_Crowdsale.new(tokenLocal.address, crowdsaleSharedLedgerLocal.address, CROWDSALE_WALLET, mockCrowdsale.crowdsaleRateEth, timings, mockCrowdsale.crowdsaleICODiscounts);

      await crowdsaleSharedLedgerLocal.transferOwnership(crowdsaleLocal.address);
      await tokenLocal.transferOwnership(crowdsaleLocal.address);

      await IncreaseTime.increaseTimeTo(timings[timings.length - 1] + IncreaseTime.duration.minutes(1));
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

    let timings = [];
    for (i = 0; i < 7; i++) {
      timings[i] = CROWDSALE_OPENING + IncreaseTime.duration.hours(i);
    }

    let mockToken = MockToken.getMock();
    let mockCrowdsale = MockCrowdsale.getMock();

    tokenLocal = await IMP_Token.new(mockToken.tokenName, mockToken.tokenSymbol, mockToken.tokenDecimals);
    crowdsaleSharedLedgerLocal = await IMP_CrowdsaleSharedLedger.new(tokenLocal.address, mockCrowdsale.crowdsaleTotalSupplyLimit, [mockCrowdsale.tokenPercentageReservedPreICO, mockCrowdsale.tokenPercentageReservedICO, mockCrowdsale.tokenPercentageReservedTeam, mockCrowdsale.tokenPercentageReservedPlatform, mockCrowdsale.tokenPercentageReservedAirdrops]);
    crowdsaleLocal = await IMP_Crowdsale.new(tokenLocal.address, crowdsaleSharedLedgerLocal.address, CROWDSALE_WALLET, mockCrowdsale.crowdsaleRateEth, timings, mockCrowdsale.crowdsalePreICODiscounts);

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

      let timings = [];
      for (i = 0; i < 4; i++) {
        timings[i] = CROWDSALE_OPENING + IncreaseTime.duration.hours(i);
      }

      let mockCrowdsale = MockCrowdsale.getMock();

      crowdsaleLocal = await IMP_Crowdsale.new(tokenLocal.address, crowdsaleSharedLedgerLocal.address, CROWDSALE_WALLET, mockCrowdsale.crowdsaleRateEth, timings, mockCrowdsale.crowdsaleICODiscounts);

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