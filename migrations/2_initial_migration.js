let IMP_Token = artifacts.require("./IMP_Token.sol");
let IMP_Crowdsale = artifacts.require("./IMP_Crowdsale.sol");
let IncreaseTime = require("../test/helpers/increaseTime.js");
let IMP_CrowdsaleSharedLedger = artifacts.require("./IMP_CrowdsaleSharedLedger");

/**
 * IMPORTANT: 
 */

module.exports = (deployer, network, accounts) => {
  const TOKEN_NAME = "Impressive Token";
  const TOKEN_SYMBOL = "IMP";
  const TOKEN_DECIMALS = 4;

  const CROWDSALE_WALLET = accounts[4];
  const CROWDSALE_TOTAL_SUPPLY_LIMIT = 100000000;

  const CROWDSALE_OPENING = web3.eth.getBlock("latest").timestamp + IncreaseTime.duration.minutes(1);
  const CROWDSALE_CLOSING = CROWDSALE_OPENING + IncreaseTime.duration.weeks(6);
  
  const TOKEN_PERCENTAGE_RESERVED_PRE_ICO = 30;
  const TOKEN_PERCENTAGE_RESERVED_ICO = 44;
  const TOKEN_PERCENTAGE_RESERVED_TEAM = 18;
  const TOKEN_PERCENTAGE_RESERVED_PLATFORM = 5;
  const TOKEN_PERCENTAGE_RESERVED_AIRDROPS = 2;

  const PRE_ICO_DISCOUNTS = [20, 10]; //  including each edge
  const ICO_DISCOUNTS = [10, 0]; //  including each edge
  
  deployer.deploy(IMP_Token, TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS).then(async () => {
      let token = await IMP_Token.deployed();
      
      await deployer.deploy(
        IMP_CrowdsaleSharedLedger, 
        token.address, 
        CROWDSALE_TOTAL_SUPPLY_LIMIT, 
        [TOKEN_PERCENTAGE_RESERVED_PRE_ICO, 
          TOKEN_PERCENTAGE_RESERVED_ICO, 
          TOKEN_PERCENTAGE_RESERVED_TEAM, 
          TOKEN_PERCENTAGE_RESERVED_PLATFORM, 
          TOKEN_PERCENTAGE_RESERVED_AIRDROPS]);

      let sharedLedger = await IMP_CrowdsaleSharedLedger.deployed();

      await deployer.deploy(
        IMP_Crowdsale, 
        token.address, 
        sharedLedger.address, 
        CROWDSALE_WALLET, 
        [CROWDSALE_OPENING, CROWDSALE_CLOSING]);
      
      let crowdsale = await IMP_Crowdsale.deployed();

      await token.transferOwnership(crowdsale.address);

  });
}
