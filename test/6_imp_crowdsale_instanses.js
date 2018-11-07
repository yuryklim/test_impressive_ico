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
    const CROWDSALE_OPENING = web3.eth.getBlock('latest').timestamp + IncreaseTime.duration.minutes(3);
    const CROWDSALE_CLOSING = CROWDSALE_OPENING + IncreaseTime.duration.days(1);
    let mockToken = MockToken.getMock();
    let mockCrowdsale = MockCrowdsale.getMock();
    tokenLocal = await IMP_Token.new(mockToken.tokenName, mockToken.tokenSymbol, mockToken.tokenDecimals);
    crowdsaleSharedLedger = await IMP_CrowdsaleSharedLedger.new(tokenLocal.address, mockCrowdsale.crowdsaleTotalSupplyLimit, [mockCrowdsale.tokenPercentageReservedPreICO, mockCrowdsale.tokenPercentageReservedICO, mockCrowdsale.tokenPercentageReservedTeam, mockCrowdsale.tokenPercentageReservedPlatform, mockCrowdsale.tokenPercentageReservedAirdrops]);
    crowdsaleLocal = await IMP_Crowdsale.new(tokenLocal.address, crowdsaleSharedLedger.address, CROWDSALE_WALLET, [CROWDSALE_OPENING, CROWDSALE_CLOSING], 200000);
    await tokenLocal.transferOwnership(crowdsaleLocal.address);
    IncreaseTime.increaseTimeTo(CROWDSALE_OPENING);
    await Reverter.snapshot();
  });
  afterEach('revert', async () => {
    await Reverter.revert();
  });
  describe.only("validate token mint limits", () => {
    it("should validate can mint maximum preICO limit", async () => {
      // let maxTokens = new BigNumber(await crowdsaleLocal.tokenLimitReserved_purchase.call()).toNumber();
      // console.log("maxTokens: ", maxTokens);
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
