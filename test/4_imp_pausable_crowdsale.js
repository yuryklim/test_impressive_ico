let IMP_Crowdsale = artifacts.require("IMP_Crowdsale.sol");

const expectThrow = require('./helpers/expectThrow');
const Reverter = require('./helpers/reverter');

let crowdsale;

contract("Pausable", (accounts) => {

  const ACC_1 = accounts[1];

  before("setup", async () => {
    crowdsale = await IMP_Crowdsale.deployed();
    await Reverter.snapshot();
  });

  beforeEach("add to whitelist", async () => {
    await crowdsale.addAddressToWhitelist(ACC_1);
  });

  afterEach("revert", async () => {
    await Reverter.revert();
  });

  describe.only("pausable functional", () => {
    it("should allow owner to pause / unpause crowdsale", async () => {

      await crowdsale.pause();

      await expectThrow(crowdsale.sendTransaction({
        from: ACC_1,
        value: web3.toWei(1, "ether")
      }), "should not be available for purchase");

      await crowdsale.unpause();
    });

    it("should not allow not owner to pause / unpause crowdsale", async () => {

      await expectThrow(crowdsale.pause({
        from: ACC_1
      }), "should not allow not owner to pause");

      await crowdsale.sendTransaction({
        from: ACC_1,
        value: web3.toWei(1, "ether")
      });

      await expectThrow(crowdsale.unpause({
        from: ACC_1
      }), "should not allow not owner to unpause");
    });

    it("should not allow purchase while crowdsale is paused", async () => {

      await crowdsale.pause();

      await expectThrow(crowdsale.sendTransaction({
        from: ACC_1,
        value: web3.toWei(1, "ether")
      }), "should not be available for purchase");

      await crowdsale.unpause();

      await crowdsale.sendTransaction({
        from: ACC_1,
        value: web3.toWei(1, "ether")
      });
    });

    const ONE_FULL_TOKEN = 10000;

    it("should not allow manualMint_team while paused", async () => {

      await crowdsale.pause();

      await expectThrow(crowdsale.manualMint_team(ACC_1, ONE_FULL_TOKEN), "manualMint_team not allowed while paused");

      await crowdsale.unpause();

      await crowdsale.manualMint_team(ACC_1, ONE_FULL_TOKEN);
    });

    it("should not allow manualMint_platform while paused", async () => {

      await crowdsale.pause();

      await expectThrow(crowdsale.manualMint_platform(ACC_1, ONE_FULL_TOKEN), "manualMint_platform not allowed while paused");

      await crowdsale.unpause();

      await crowdsale.manualMint_platform(ACC_1, ONE_FULL_TOKEN);
    });

    it("should not allow manualMint_airdrops while paused", async () => {

      await crowdsale.pause();

      await expectThrow(crowdsale.manualMint_airdrops(ACC_1, ONE_FULL_TOKEN), "manualMint_airdrops not allowed while paused");

      await crowdsale.unpause();

      await crowdsale.manualMint_airdrops(ACC_1, ONE_FULL_TOKEN);
    });
  });
}); 
