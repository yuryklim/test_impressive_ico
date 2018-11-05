let IMP_Token = artifacts.require("./IMP_Token.sol");
let IMP_Crowdsale = artifacts.require("./IMP_Crowdsale.sol");

/**
 * IMPORTANT: 
 */

module.exports = (deployer, network, accounts) => {
  const TOKEN_NAME = "Impressive Token";
  const TOKEN_SYMBOL = "IMP";
  const TOKEN_DECIMALS = 4;
  const CROWDSALE_TOTAL_SUPPLY_LIMIT = 100;
  const PRE_ICO_TOTAL_SUPPLY_LIMIT_PERCENT = 30;
  const ICO_TOTAL_SUPPLY_LIMIT_PERCENT = 42;
  const TEAM_SUPPLY_RESERVED_PERCENT = 18;
  const PLATFORM_SUPPLY_RESERVED_PERCENT = 10;
  

  const ICO_RATE = 10; // tokens per 1 ETH
  const ICO_WALLET = accounts[4];
  const ICO_TOTAL_SUPPLY_LIMIT = 100000000 * 10000; //  100 000 000 * 4 decimals
  const ICO_TOKEN_PERCENTAGE = 30; //  30% - pre-ICO, 42% - ICO, 18% - team, 10% - platform to start

  deployer.deploy(IMP_Token, 
    TOKEN_NAME, TOKEN_SYMBOL, 
    TOKEN_DECIMALS, 
    CROWDSALE_TOTAL_SUPPLY_LIMIT,
    PRE_ICO_TOTAL_SUPPLY_LIMIT_PERCENT,
    ICO_TOTAL_SUPPLY_LIMIT_PERCENT,
    TEAM_SUPPLY_RESERVED_PERCENT,
    PLATFORM_SUPPLY_RESERVED_PERCENT).then(async () => {
      let token = await IMP_Token.deployed();

      await deployer.deploy(IMP_Crowdsale, 
        ICO_RATE, 
        ICO_TOTAL_SUPPLY_LIMIT, 
        ICO_TOKEN_PERCENTAGE, 
        ICO_WALLET, 
        token.address
      );
      let crowdsale = await IMP_Crowdsale.deployed();

      await token.transferOwnership(crowdsale.address);

  });
}
