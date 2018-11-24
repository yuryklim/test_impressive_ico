const IMP_Token = artifacts.require('./IMP_Token.sol');
const IMP_Crowdsale = artifacts.require('./IMP_Crowdsale.sol');

let IMP_CrowdsaleSharedLedger = artifacts.require("IMP_CrowdsaleSharedLedger");

const Reverter = require('./helpers/reverter');
const IncreaseTime = require('./helpers/increaseTime');
const expectThrow = require('./helpers/expectThrow');
const MockToken = require('./helpers/MockToken');
const MockCrowdsale = require('./helpers/MockCrowdsale');
var BigNumber = require('bignumber.js');

contract('TimedCrowdsale - new instance', (accounts) => {
  const ACC_1 = accounts[1];

  let tokenLocal;
  let crowdsaleSharedLedger;
  let crowdsaleLocal;

  before('setup', async () => {

    const CROWDSALE_WALLET = accounts[4];
    const CROWDSALE_OPENING = web3.eth.getBlock('latest').timestamp + IncreaseTime.duration.minutes(3);
    const CROWDSALE_CLOSING = CROWDSALE_OPENING + IncreaseTime.duration.days(1);

    let timings = [];
    for (i = 0; i < 7; i++) {
      timings[i] = CROWDSALE_OPENING + IncreaseTime.duration.hours(i);
    }

    let mockToken = MockToken.getMock();
    let mockCrowdsale = MockCrowdsale.getMock();

    tokenLocal = await IMP_Token.new(
      mockToken.tokenName, 
      mockToken.tokenSymbol, 
      mockToken.tokenDecimals);

    crowdsaleSharedLedger = await IMP_CrowdsaleSharedLedger.new(
      tokenLocal.address, 
      mockCrowdsale.crowdsaleTotalSupplyLimit, 
      [mockCrowdsale.tokenPercentageReservedPreICO, 
        mockCrowdsale.tokenPercentageReservedICO, 
        mockCrowdsale.tokenPercentageReservedTeam, 
        mockCrowdsale.tokenPercentageReservedPlatform, 
        mockCrowdsale.tokenPercentageReservedAirdrops]);

        crowdsaleLocal = await IMP_Crowdsale.new(
          tokenLocal.address, 
          crowdsaleSharedLedger.address, 
          CROWDSALE_WALLET, 
          mockCrowdsale.crowdsaleRateEth, 
          timings, 
          mockCrowdsale.crowdsalePreICODiscounts);

    await tokenLocal.transferOwnership(crowdsaleLocal.address);

    await Reverter.snapshot();

    await tokenLocal.transferOwnership(crowdsaleLocal.address);

    await Reverter.snapshot();
  });
  
  afterEach('revert', async () => {
  
    await Reverter.revert();
  });
  
  describe('before Crowdsale started', () => {
    it('should be false for hasOpened', async () => {
      
      await assert.isFalse(await crowdsaleLocal.hasOpened.call(), "should not be started yet");
    });

    it("should fail on purchase", async () => {
     
      await crowdsaleLocal.addAddressToWhitelist(ACC_1);
      
      await expectThrow(crowdsaleLocal.sendTransaction({
        from: ACC_1,
        value: web3.toWei(1, 'ether')
      }));
    });
  });

  describe("after Crowdsale finishes", () => {
    it('should be false for hasOpened', async () => {
      
      let closeTime = new BigNumber(await crowdsaleLocal.closingTime.call()).plus(IncreaseTime.duration.seconds(1));
      
      await IncreaseTime.increaseTimeTo(closeTime);
      
      await assert.isTrue(await crowdsaleLocal.hasClosed.call(), "should be closed already");
    });

    it("should fail on purchase", async () => {
      
      await crowdsaleLocal.addAddressToWhitelist(ACC_1);
      
      let closeTime = new BigNumber(await crowdsaleLocal.closingTime.call()).plus(IncreaseTime.duration.seconds(2));
      
      await IncreaseTime.increaseTimeTo(closeTime);
      
      await expectThrow(crowdsaleLocal.sendTransaction({
        from: ACC_1,
        value: web3.toWei(1, 'ether')
      }));
    });
  });
});
