const IMP_Token = artifacts.require('./IMP_Token.sol');
const IMP_Crowdsale = artifacts.require('./IMP_Crowdsale.sol');
let IMP_CrowdsaleSharedLedger = artifacts.require("IMP_CrowdsaleSharedLedger");

const Reverter = require('./helpers/reverter');
const IncreaseTime = require('./helpers/increaseTime');
const expectThrow = require('./helpers/expectThrow');
const MockToken = require('./helpers/MockToken');
const MockCrowdsale = require('./helpers/MockCrowdsale');
var BigNumber = require('bignumber.js');

contract("IMP_Crowdsale - discounts testing", (accounts) => {
  const ACC_1 = accounts[1];
  const ACC_2 = accounts[2];

  let tokenLocal;
  let crowdsaleSharedLedger;
  let crowdsaleLocal;

  before('setup', async () => {
    const CROWDSALE_WALLET = accounts[4];
    const CROWDSALE_OPENING = web3.eth.getBlock('latest').timestamp + IncreaseTime.duration.days(15);

    let timings = [];
    for (i = 0; i < 7; i++) {
      timings[i] = CROWDSALE_OPENING + IncreaseTime.duration.hours(i);
    }

    let mockToken = MockToken.getMock();
    let mockCrowdsale = MockCrowdsale.getMock();

    tokenLocal = await IMP_Token.new(mockToken.tokenName, mockToken.tokenSymbol, mockToken.tokenDecimals);
    crowdsaleSharedLedger = await IMP_CrowdsaleSharedLedger.new(tokenLocal.address, mockCrowdsale.crowdsaleTotalSupplyLimit, [mockCrowdsale.tokenPercentageReservedPreICO, mockCrowdsale.tokenPercentageReservedICO, mockCrowdsale.tokenPercentageReservedTeam, mockCrowdsale.tokenPercentageReservedPlatform, mockCrowdsale.tokenPercentageReservedAirdrops]);
    crowdsaleLocal = await IMP_Crowdsale.new(tokenLocal.address, crowdsaleSharedLedger.address, CROWDSALE_WALLET, mockCrowdsale.crowdsaleRateEth, timings, mockCrowdsale.crowdsalePreICODiscounts);
    await tokenLocal.transferOwnership(crowdsaleLocal.address);

    IncreaseTime.increaseTimeTo(CROWDSALE_OPENING + IncreaseTime.duration.minutes(1));

    await Reverter.snapshot();
  });

  afterEach('revert', async () => {
    await Reverter.revert();
  });

  describe("validate discounts and mintedTokens", () => {
    it("should validate discounts and mintedTokens are calculated correctly", async () => {
      await crowdsaleLocal.addAddressesToWhitelist([ACC_1, ACC_2]);

      //  stage 1
      let currentDiscount = new BigNumber(await crowdsaleLocal.currentDiscount.call()).toNumber();
      assert.equal(currentDiscount, 20, "1 - should be 20%");

      let calculatedTokenAmount = new BigNumber(await crowdsaleLocal.calculateTokenAmount.call(web3.toWei(0.5, "ether"))).toNumber();
      assert.equal(calculatedTokenAmount, 600000, "1 - should be 60 tokens");

      let tokensMinted_purchase = new BigNumber(await crowdsaleLocal.tokensMinted_purchase.call());
      let tokensAvailableToMint_purchase = new BigNumber(await crowdsaleLocal.tokensAvailableToMint_purchase.call());

      await crowdsaleLocal.sendTransaction({
        from: ACC_1,
        value: web3.toWei(0.5, "ether")
      });

      assert.equal(new BigNumber(await tokenLocal.balanceOf.call(ACC_1)).toNumber(), 600000, "1 - wrong balance of ACC_1");

      //  minted
      let tokensMinted_purchase_after = new BigNumber(await crowdsaleLocal.tokensMinted_purchase.call());

      let mintedDiff = tokensMinted_purchase_after.minus(tokensMinted_purchase).toNumber();
      assert.equal(mintedDiff, 600000, "1 - wrong tokensMinted_preICO");

      //  available to mint
      let tokensAvailableToMint_purchase_after = new BigNumber(await crowdsaleLocal.tokensAvailableToMint_purchase.call());
      let availableToMintDiff = tokensAvailableToMint_purchase.minus(tokensAvailableToMint_purchase_after).toNumber();

      assert.equal(availableToMintDiff, 600000, "1 - wrong decrease value for tokensAvailableToMint_preICO");


      //  stage 2
      await IncreaseTime.increaseTimeTo((await crowdsaleLocal.stageEdges.call(0)).toNumber() + IncreaseTime.duration.minutes(1));

      currentDiscount = new BigNumber(await crowdsaleLocal.currentDiscount.call()).toNumber();
      assert.equal(currentDiscount, 18, "2 - should be 18%");

      calculatedTokenAmount = new BigNumber(await crowdsaleLocal.calculateTokenAmount.call(web3.toWei(1.5, "ether"))).toNumber();
      assert.equal(calculatedTokenAmount, 1770000, "2 - should be 1770000 tokens");

      await crowdsaleLocal.sendTransaction({
        from: ACC_1,
        value: web3.toWei(1.5, "ether")
      });

      assert.equal(new BigNumber(await tokenLocal.balanceOf.call(ACC_1)).toNumber(), 2370000, "2 - wrong balance of ACC_1");

      //  minted
      tokensMinted_purchase_after = new BigNumber(await crowdsaleLocal.tokensMinted_purchase.call());

      mintedDiff = tokensMinted_purchase_after.minus(tokensMinted_purchase).toNumber();
      assert.equal(mintedDiff, 2370000, "2 - wrong tokensMinted_preICO");

      //  available to mint
      tokensAvailableToMint_purchase_after = new BigNumber(await crowdsaleLocal.tokensAvailableToMint_purchase.call());
      availableToMintDiff = tokensAvailableToMint_purchase.minus(tokensAvailableToMint_purchase_after).toNumber();

      assert.equal(availableToMintDiff, 2370000, "2 - wrong decrease value for tokensAvailableToMint_preICO");


      //  stage 3
      await IncreaseTime.increaseTimeTo((await crowdsaleLocal.stageEdges.call(1)).toNumber() + IncreaseTime.duration.minutes(1));

      currentDiscount = new BigNumber(await crowdsaleLocal.currentDiscount.call()).toNumber();
      assert.equal(currentDiscount, 16, "3 - should be 16%");

      calculatedTokenAmount = new BigNumber(await crowdsaleLocal.calculateTokenAmount.call(web3.toWei(2, "ether"))).toNumber();
      assert.equal(calculatedTokenAmount, 2320000, "3 - should be 2320000 tokens");

      await crowdsaleLocal.sendTransaction({
        from: ACC_2,
        value: web3.toWei(2, "ether")
      });

      assert.equal(new BigNumber(await tokenLocal.balanceOf.call(ACC_2)).toNumber(), 2320000, "3 - wrong balance of ACC_2");

      //  minted
      tokensMinted_purchase_after = new BigNumber(await crowdsaleLocal.tokensMinted_purchase.call());

      mintedDiff = tokensMinted_purchase_after.minus(tokensMinted_purchase).toNumber();
      assert.equal(mintedDiff, 4690000, "3 - wrong tokensMinted_preICO");

      //  available to mint
      tokensAvailableToMint_purchase_after = new BigNumber(await crowdsaleLocal.tokensAvailableToMint_purchase.call());
      availableToMintDiff = tokensAvailableToMint_purchase.minus(tokensAvailableToMint_purchase_after).toNumber();

      assert.equal(availableToMintDiff, 4690000, "3 - wrong decrease value for tokensAvailableToMint_preICO");


      //  stage 4
      await IncreaseTime.increaseTimeTo((await crowdsaleLocal.stageEdges.call(2)).toNumber() + IncreaseTime.duration.minutes(1));

      currentDiscount = new BigNumber(await crowdsaleLocal.currentDiscount.call()).toNumber();
      assert.equal(currentDiscount, 14, "4 - should be 14%");

      calculatedTokenAmount = new BigNumber(await crowdsaleLocal.calculateTokenAmount.call(web3.toWei(3, "ether"))).toNumber();
      assert.equal(calculatedTokenAmount, 3420000, "4 - should be 3420000 tokens");

      await crowdsaleLocal.sendTransaction({
        from: ACC_2,
        value: web3.toWei(3, "ether")
      });

      assert.equal(new BigNumber(await tokenLocal.balanceOf.call(ACC_2)).toNumber(), 5740000, "4 - wrong balance of ACC_2");

      //  minted
      tokensMinted_purchase_after = new BigNumber(await crowdsaleLocal.tokensMinted_purchase.call());

      mintedDiff = tokensMinted_purchase_after.minus(tokensMinted_purchase).toNumber();
      assert.equal(mintedDiff, 8110000, "4 - wrong tokensMinted_preICO");

      //  available to mint
      tokensAvailableToMint_purchase_after = new BigNumber(await crowdsaleLocal.tokensAvailableToMint_purchase.call());
      availableToMintDiff = tokensAvailableToMint_purchase.minus(tokensAvailableToMint_purchase_after).toNumber();

      assert.equal(availableToMintDiff, 8110000, "4 - wrong decrease value for tokensAvailableToMint_preICO");


      //  stage 5
      await IncreaseTime.increaseTimeTo((await crowdsaleLocal.stageEdges.call(3)).toNumber() + IncreaseTime.duration.minutes(1));

      currentDiscount = new BigNumber(await crowdsaleLocal.currentDiscount.call()).toNumber();
      assert.equal(currentDiscount, 12, "5 - should be 12%");

      calculatedTokenAmount = new BigNumber(await crowdsaleLocal.calculateTokenAmount.call(web3.toWei(4, "ether"))).toNumber();
      assert.equal(calculatedTokenAmount, 4480000, "5 - should be 4480000 tokens");

      await crowdsaleLocal.sendTransaction({
        from: ACC_2,
        value: web3.toWei(4, "ether")
      });

      assert.equal(new BigNumber(await tokenLocal.balanceOf.call(ACC_2)).toNumber(), 10220000, "5 - wrong balance of ACC_2");

      //  minted
      tokensMinted_purchase_after = new BigNumber(await crowdsaleLocal.tokensMinted_purchase.call());

      mintedDiff = tokensMinted_purchase_after.minus(tokensMinted_purchase).toNumber();
      assert.equal(mintedDiff, 12590000, "5 - wrong tokensMinted_preICO");

      //  available to mint
      tokensAvailableToMint_purchase_after = new BigNumber(await crowdsaleLocal.tokensAvailableToMint_purchase.call());
      availableToMintDiff = tokensAvailableToMint_purchase.minus(tokensAvailableToMint_purchase_after).toNumber();

      assert.equal(availableToMintDiff, 12590000, "5 - wrong decrease value for tokensAvailableToMint_preICO");


      //  stage 6
      await IncreaseTime.increaseTimeTo((await crowdsaleLocal.stageEdges.call(4)).toNumber() + IncreaseTime.duration.minutes(1));

      currentDiscount = new BigNumber(await crowdsaleLocal.currentDiscount.call()).toNumber();
      assert.equal(currentDiscount, 10, "6 - should be 10%");

      calculatedTokenAmount = new BigNumber(await crowdsaleLocal.calculateTokenAmount.call(web3.toWei(5, "ether"))).toNumber();
      assert.equal(calculatedTokenAmount, 5500000, "6 - should be 5500000 tokens");

      await crowdsaleLocal.sendTransaction({
        from: ACC_2,
        value: web3.toWei(5, "ether")
      });

      assert.equal(new BigNumber(await tokenLocal.balanceOf.call(ACC_2)).toNumber(), 15720000, "6 - wrong balance of ACC_2");

      //  minted
      tokensMinted_purchase_after = new BigNumber(await crowdsaleLocal.tokensMinted_purchase.call());

      mintedDiff = tokensMinted_purchase_after.minus(tokensMinted_purchase).toNumber();
      assert.equal(mintedDiff, 18090000, "6 - wrong tokensMinted_preICO");

      //  available to mint
      tokensAvailableToMint_purchase_after = new BigNumber(await crowdsaleLocal.tokensAvailableToMint_purchase.call());
      availableToMintDiff = tokensAvailableToMint_purchase.minus(tokensAvailableToMint_purchase_after).toNumber();

      assert.equal(availableToMintDiff, 18090000, "6 - wrong decrease value for tokensAvailableToMint_preICO");
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
    const CROWDSALE_OPENING = web3.eth.getBlock('latest').timestamp + IncreaseTime.duration.days(17);

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

    IncreaseTime.increaseTimeTo(CROWDSALE_OPENING + IncreaseTime.duration.minutes(1));

    await Reverter.snapshot();
  });

  afterEach('revert', async () => {
    await Reverter.revert();
  });

  describe("validate correct calculations while ICO minting", () => {
    const ONE_FULL_TOKEN = 10000;

    it("should decrease ICO", async () => {
      await crowdsaleLocal.addAddressesToWhitelist([ACC_1, ACC_2]);

      await crowdsaleLocal.sendTransaction({
        from: ACC_1,
        value: web3.toWei(5, "ether")
      });
      let tokensMinted_purchasePreICO = new BigNumber(await crowdsaleLocal.tokensMinted_purchase.call());

      //  finalize preICO and move to ICO period
      let closing = new BigNumber(await crowdsaleLocal.closingTime.call());
      await IncreaseTime.increaseTimeTo(closing.plus(IncreaseTime.duration.minutes(1)));
      await crowdsaleLocal.finalize();

      //  new contract for ICO
      const CROWDSALE_WALLET = accounts[4];
      const CROWDSALE_OPENING = web3.eth.getBlock('latest').timestamp + IncreaseTime.duration.minutes(3);

      let timings = [];
      for (i = 0; i < 4; i++) {
        timings[i] = CROWDSALE_OPENING + IncreaseTime.duration.hours(i);
      }

      let mockCrowdsale = MockCrowdsale.getMock();
      crowdsaleLocal = await IMP_Crowdsale.new(tokenLocal.address, crowdsaleSharedLedgerLocal.address, CROWDSALE_WALLET, mockCrowdsale.crowdsaleRateEth * 5000, timings, mockCrowdsale.crowdsaleICODiscounts);

      await crowdsaleSharedLedgerLocal.transferOwnership(crowdsaleLocal.address);
      await tokenLocal.transferOwnership(crowdsaleLocal.address);
      IncreaseTime.increaseTimeTo(CROWDSALE_OPENING);


      //  test manual mintings
      let tokensMinted_team = new BigNumber(await crowdsaleLocal.tokensMinted_team.call());
      await crowdsaleLocal.manualMint_team(ACC_2, ONE_FULL_TOKEN * 2);
      let tokensMinted_team_after = new BigNumber(await crowdsaleLocal.tokensMinted_team.call());
      let tokensMinted_team_Diff = tokensMinted_team_after.minus(tokensMinted_team).toNumber();
      assert.equal(tokensMinted_team_Diff, 20000, "wrong tokensMinted_team");

      let tokensMinted_platform = new BigNumber(await crowdsaleLocal.tokensMinted_platform.call());
      await crowdsaleLocal.manualMint_platform(ACC_2, ONE_FULL_TOKEN);
      let tokensMinted_platform_after = new BigNumber(await crowdsaleLocal.tokensMinted_platform.call());
      let tokensMinted_platform_Diff = tokensMinted_platform_after.minus(tokensMinted_platform).toNumber();
      assert.equal(tokensMinted_platform_Diff, 10000, "wrong tokensMinted_platform");

      let tokensMinted_airdrops = new BigNumber(await crowdsaleLocal.tokensMinted_airdrops.call());
      await crowdsaleLocal.manualMint_airdrops(ACC_2, ONE_FULL_TOKEN);
      let tokensMinted_airdrops_after = new BigNumber(await crowdsaleLocal.tokensMinted_airdrops.call());
      let tokensMinted_airdrops_Diff = tokensMinted_airdrops_after.minus(tokensMinted_airdrops).toNumber();
      assert.equal(tokensMinted_airdrops_Diff, 10000, "wrong tokensMinted_airdrops");

      assert.equal(new BigNumber(await tokenLocal.balanceOf(ACC_2)).toNumber(), 40000, "wrong ACC_2 balance after manual transfers");

      //  TODO: send more, than limits ^^^ all three


      //  test purchase calculations
      await crowdsaleLocal.addAddressesToWhitelist([ACC_1, ACC_2]);

      //  stage 1
      let currentDiscount = new BigNumber(await crowdsaleLocal.currentDiscount.call()).toNumber();
      assert.equal(currentDiscount, 10, "1 - should be 10%");

      let calculatedTokenAmount = new BigNumber(await crowdsaleLocal.calculateTokenAmount.call(web3.toWei(1, "ether"))).toNumber();
      assert.equal(calculatedTokenAmount, 5500000000, "1 - should be 5500000000 tokens");

      let tokensMinted_purchase = new BigNumber(await crowdsaleLocal.tokensMinted_purchase.call());
      let tokensAvailableToMint_purchase = new BigNumber(await crowdsaleLocal.tokensAvailableToMint_purchase.call());

      await crowdsaleLocal.sendTransaction({
        from: ACC_1,
        value: web3.toWei(1, "ether")
      });

      assert.equal(new BigNumber(await tokenLocal.balanceOf.call(ACC_1)).toNumber(), 5506000000, "1 - wrong balance of ACC_1");

      //  minted
      let tokensMinted_purchase_after = new BigNumber(await crowdsaleLocal.tokensMinted_purchase.call());

      let mintedDiff = tokensMinted_purchase_after.minus(tokensMinted_purchase).toNumber();
      assert.equal(mintedDiff, 5500000000, "1 - wrong tokensMinted_ICO");

      //  available to mint
      let tokensAvailableToMint_purchase_after = new BigNumber(await crowdsaleLocal.tokensAvailableToMint_purchase.call());
      let availableToMintDiff = tokensAvailableToMint_purchase.minus(tokensAvailableToMint_purchase_after).toNumber();

      assert.equal(availableToMintDiff, 5500000000, "1 - wrong decrease value for tokensAvailableToMint_ICO");


      //  stage 2
      await IncreaseTime.increaseTimeTo((await crowdsaleLocal.stageEdges.call(0)).toNumber() + IncreaseTime.duration.minutes(1));

      currentDiscount = new BigNumber(await crowdsaleLocal.currentDiscount.call()).toNumber();
      assert.equal(currentDiscount, 9, "2 - should be 9%");

      calculatedTokenAmount = new BigNumber(await crowdsaleLocal.calculateTokenAmount.call(web3.toWei(2, "ether"))).toNumber();
      assert.equal(calculatedTokenAmount, 10900000000, "1 - should be 10900000000 tokens");

      tokensMinted_purchase = new BigNumber(await crowdsaleLocal.tokensMinted_purchase.call());
      tokensAvailableToMint_purchase = new BigNumber(await crowdsaleLocal.tokensAvailableToMint_purchase.call());

      await crowdsaleLocal.sendTransaction({
        from: ACC_1,
        value: web3.toWei(2, "ether")
      });

      assert.equal(new BigNumber(await tokenLocal.balanceOf.call(ACC_1)).toNumber(), 16406000000, "2 - wrong balance of ACC_1");

      //  minted
      tokensMinted_purchase_after = new BigNumber(await crowdsaleLocal.tokensMinted_purchase.call());

      mintedDiff = tokensMinted_purchase_after.minus(tokensMinted_purchase).toNumber();
      assert.equal(mintedDiff, 10900000000, "2 - wrong tokensMinted_ICO");

      //  available to mint
      tokensAvailableToMint_purchase_after = new BigNumber(await crowdsaleLocal.tokensAvailableToMint_purchase.call());
      availableToMintDiff = tokensAvailableToMint_purchase.minus(tokensAvailableToMint_purchase_after).toNumber();

      assert.equal(availableToMintDiff, 10900000000, "2 - wrong decrease value for tokensAvailableToMint_ICO");


      //  stage 3
      await IncreaseTime.increaseTimeTo((await crowdsaleLocal.stageEdges.call(1)).toNumber() + IncreaseTime.duration.minutes(1));

      currentDiscount = new BigNumber(await crowdsaleLocal.currentDiscount.call()).toNumber();
      assert.equal(currentDiscount, 8, "3 - should be 8%");

      calculatedTokenAmount = new BigNumber(await crowdsaleLocal.calculateTokenAmount.call(web3.toWei(3, "ether"))).toNumber();
      assert.equal(calculatedTokenAmount, 16200000000, "3 - should be 16200000000 tokens");

      tokensMinted_purchase = new BigNumber(await crowdsaleLocal.tokensMinted_purchase.call());
      tokensAvailableToMint_purchase = new BigNumber(await crowdsaleLocal.tokensAvailableToMint_purchase.call());

      await crowdsaleLocal.sendTransaction({
        from: ACC_1,
        value: web3.toWei(3, "ether")
      });

      assert.equal(new BigNumber(await tokenLocal.balanceOf.call(ACC_1)).toNumber(), 32606000000, "3 - wrong balance of ACC_1");

      //  minted
      tokensMinted_purchase_after = new BigNumber(await crowdsaleLocal.tokensMinted_purchase.call());

      mintedDiff = tokensMinted_purchase_after.minus(tokensMinted_purchase).toNumber();
      assert.equal(mintedDiff, 16200000000, "3 - wrong tokensMinted_ICO");

      //  available to mint
      tokensAvailableToMint_purchase_after = new BigNumber(await crowdsaleLocal.tokensAvailableToMint_purchase.call());
      availableToMintDiff = tokensAvailableToMint_purchase.minus(tokensAvailableToMint_purchase_after).toNumber();

      assert.equal(availableToMintDiff, 16200000000, "3 - wrong decrease value for tokensAvailableToMint_ICO");


      //  exceed limit
      await crowdsaleLocal.sendTransaction({
        from: ACC_2,
        value: web3.toWei(99, "ether")
      });

      await expectThrow(crowdsaleLocal.sendTransaction({
        from: ACC_1,
        value: web3.toWei(88, "ether")
      }), "should not exceed purchase limit");
    });
  });
});