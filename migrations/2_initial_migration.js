let IMP_Token = artifacts.require("./IMP_Token.sol");
let IMP_Crowdsale = artifacts.require("./IMP_Crowdsale.sol");

/**
 * IMPORTANT: 
 */

module.exports = (deployer, network, accounts) => {
  const TOKEN_NAME = "Impressive Token";
  const TOKEN_SYMBOL = "IMP";
  const TOKEN_DECIMALS = 4;

  const CROWDSALE_TYPE_PRE_ICO = 0;
  const CROWDSALE_TYPE_ICO = 1;

  const CROWDSALE_RATE = 10; // tokens per 1 ETH
  const CROWDSALE_WALLET = accounts[4];
  const CROWDSALE_TOTAL_SUPPLY_LIMIT = 100000000;

  const TOKEN_PERCENTAGE_RESERVED_PRE_ICO = 30;
  const TOKEN_PERCENTAGE_RESERVED_ICO = 44;
  const TOKEN_PERCENTAGE_RESERVED_TEAM = 18;
  const TOKEN_PERCENTAGE_RESERVED_PLATFORM = 5;
  const TOKEN_PERCENTAGE_RESERVED_AIRDROPS = 2;
  
  deployer.deploy(IMP_Token, TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS).then(async () => {
      let token = await IMP_Token.deployed();
      
        //  constructor(CrowdsaleType _crowdsaleType, uint256 _rate, address _wallet, IMP_Token _token, uint8 _tokenDecimals, uint256 _tokenLimitTotalSupply, uint8[] _tokenPercentageReservations) 
        await deployer.deploy(
          IMP_Crowdsale, 
          CROWDSALE_TYPE_PRE_ICO, 
          CROWDSALE_RATE, 
          CROWDSALE_WALLET, 
          token.address, 
          TOKEN_DECIMALS, 
          CROWDSALE_TOTAL_SUPPLY_LIMIT, 
          [TOKEN_PERCENTAGE_RESERVED_PRE_ICO, 
            TOKEN_PERCENTAGE_RESERVED_ICO, 
            TOKEN_PERCENTAGE_RESERVED_TEAM, 
            TOKEN_PERCENTAGE_RESERVED_PLATFORM, 
            TOKEN_PERCENTAGE_RESERVED_AIRDROPS]);

      let crowdsale = await IMP_Crowdsale.deployed();

      await token.transferOwnership(crowdsale.address);

  });
}
