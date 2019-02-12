let IMP_Crowdsale = artifacts.require("./IMP_Crowdsale");

const IncreaseTime = require("./helpers/increaseTime.js");

const expectThrow = require('./helpers/expectThrow');
const Reverter = require('./helpers/reverter');

let crowdsale;

contract('imp_whitelisted_crowdsale', (accounts) => {

  const OWNER = accounts[0];
  const ACC_1 = accounts[1];

  before("setup", async () => {
    crowdsale = await IMP_Crowdsale.deployed();

    IncreaseTime.increaseTimeWith(IncreaseTime.duration.minutes(1));
    
    await Reverter.snapshot();
  });

  afterEach('revert', async () => {
    await Reverter.revert();
  });

  describe("should validate whitelisted functional", () => {

    it("should validate address can be whitelisted by owner only", async () => {
      assert.isFalse(await crowdsale.whitelist(ACC_1), "ACC_1 should not be whitelisted yet");

      crowdsale.addAddressToWhitelist(ACC_1);
      assert.isTrue(await crowdsale.whitelist(ACC_1), "ACC_1 should be whitelisted");

      await expectThrow(crowdsale.addAddressToWhitelist(ACC_1, {
        from: ACC_1
      }), "should test not owner account");
    });

    it("should validate address can be removed from whitelist by owner only", async () => {
      assert.isFalse(await crowdsale.whitelist(ACC_1), "ACC_1 should not be whitelisted yet");

      crowdsale.removeAddressFromWhitelist(ACC_1);
      assert.isFalse(await crowdsale.whitelist(ACC_1), "ACC_1 should not be whitelisted");

      await expectThrow(crowdsale.removeAddressFromWhitelist(ACC_1, {
        from: ACC_1
      }), "should test not owner account");
    });

    it("should prevent user not in whitelist from purchase", async () => {
      await expectThrow(crowdsale.sendTransaction({
        from: ACC_1,
        value: web3.toWei(1, "ether")
      }, "should fail, because ACC_1 is not in whitelist"));

      await crowdsale.addAddressToWhitelist(ACC_1);
      await crowdsale.sendTransaction({
        from: ACC_1,
        value: web3.toWei(1, 'ether')
      });
    });    
  });
});
