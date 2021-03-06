pragma solidity ^0.4.24;


import "./IMP_Token.sol";

import "../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";


/**
 * @title IMP_CrowdsaleSharedLedger
 * @dev IMP_CrowdsaleSharedLedger is used to keep shared data between preICO and ICO contracts.
 */

contract IMP_CrowdsaleSharedLedger is Ownable {
  using SafeMath for uint256;

  enum CrowdsaleType {preICO, ico}
  
  CrowdsaleType public crowdsaleType;
  
  uint8 public tokenPercentageReserved_preICO;    //  % of tokens reserved for pre_ICO
  uint8 public tokenPercentageReserved_ico;       //  % of tokens reserved for ICO
  uint8 public tokenPercentageReserved_team;      //  % of tokens reserved for team
  uint8 public tokenPercentageReserved_platform;  //  % of tokens reserved for platform 
  uint8 public tokenPercentageReserved_airdrops;  //  % of tokens reserved for airdrops

  uint256 public tokenLimitTotalSupply_crowdsale; //  tokens total supply for entire crowdsale
  uint256 public tokenLimitReserved_preICO;       //  tokens reserved for pre_ICO
  uint256 public tokenLimitReserved_ico;          //  tokens reserved for ICO
  uint256 public tokenLimitReserved_team;         //  tokens reserved for team
  uint256 public tokenLimitReserved_platform;     //  tokens reserved for platform 
  uint256 public tokenLimitReserved_airdrops;     //  tokens reserved for airdrops

  uint256 public tokensMinted_preICO;    //  tokens minted for pre_ICO
  uint256 public tokensMinted_ico;       //  tokens minted for ICO
  uint256 public tokensMinted_team;      //  tokens minted for team
  uint256 public tokensMinted_platform;  //  tokens minted for platform 
  uint256 public tokensMinted_airdrops;  //  tokens minted for airdrops


  /**
   * @dev Constructor function.
   * @param _token                        Token used for crowdsale
   * @param _tokenLimitTotalSupply        Token maximum supply
   * @param _tokenPercentageReservations  Token percentage reserved for different usage: 
   * 0 - pre ICO purchase
   * 1 - ICO purchase
   * 2 - team members
   * 3 - platform beginning period
   * 4 - airdrops and bounties
   */
  constructor (IMP_Token _token, uint256 _tokenLimitTotalSupply, uint8[] _tokenPercentageReservations) public {
    crowdsaleType = CrowdsaleType.preICO;
    tokenLimitTotalSupply_crowdsale = _tokenLimitTotalSupply.mul(10**uint256(_token.decimals()));

    calculatePreICOLimits(_tokenPercentageReservations);
  }

  function getTokenReservedLimits() public view returns(uint256 purchase, uint256 team, uint256 platform, uint256 airdrops) {
    if (crowdsaleType == CrowdsaleType.preICO) {
      purchase = tokenLimitReserved_preICO;
    } else {
      purchase = tokenLimitReserved_ico;
    }

    team = tokenLimitReserved_team.sub(tokensMinted_team);
    platform = tokenLimitReserved_platform.sub(tokensMinted_platform);
    airdrops = tokenLimitReserved_airdrops.sub(tokensMinted_airdrops);
  }

  /**
   * @dev Calculates ICO limits and update crowdsale type to ICO.
   * @param _tokensMinted_purchase    Tokens minted during preICO / ICO
   * @param _tokensMinted_team        Tokens minted for team
   * @param _tokensMinted_platform    Tokens minted for platform needs
   * @param _tokensMinted_airdrops    Tokens minted for airdrops
   */
    function finalizeCrowdsale(
     uint256 _tokensMinted_purchase, 
     uint256 _tokensMinted_team, 
     uint256 _tokensMinted_platform, 
     uint256 _tokensMinted_airdrops) public onlyOwner {
    if(crowdsaleType == CrowdsaleType.preICO) {
      finalizePreICO(
        _tokensMinted_purchase, 
        _tokensMinted_team, 
        _tokensMinted_platform, 
        _tokensMinted_airdrops);
      crowdsaleType = CrowdsaleType.ico;
    } else {
      finalizeICO();
    }
  }

  /**
   * PRIVATE
   */

  /**
   * @dev calculates limits for different usage purposes.
   * @param _tokenPercentageReservations  Token percentage reserved for different usage purposes: 
   * 0 - pre ICO purchase
   * 1 - ICO purchase
   * 2 - team members
   * 3 - platform beginning period
   * 4 - airdrops and bounties
   */
  function calculatePreICOLimits(uint8[] _tokenPercentageReservations) private {
    tokenPercentageReserved_preICO = _tokenPercentageReservations[0];
    tokenPercentageReserved_ico = _tokenPercentageReservations[1];
    tokenPercentageReserved_team = _tokenPercentageReservations[2];
    tokenPercentageReserved_platform = _tokenPercentageReservations[3];
    tokenPercentageReserved_airdrops = _tokenPercentageReservations[4];

    tokenLimitReserved_preICO = tokenLimitTotalSupply_crowdsale.mul(tokenPercentageReserved_preICO).div(100);
    tokenLimitReserved_ico = tokenLimitTotalSupply_crowdsale.mul(tokenPercentageReserved_ico).div(100);
    tokenLimitReserved_team = tokenLimitTotalSupply_crowdsale.mul(tokenPercentageReserved_team).div(100);
    tokenLimitReserved_platform = tokenLimitTotalSupply_crowdsale.mul(tokenPercentageReserved_platform).div(100);
    tokenLimitReserved_airdrops = tokenLimitTotalSupply_crowdsale.mul(tokenPercentageReserved_airdrops).div(100);
  }

  /**
  * @dev Add unspent preICO tokens to ICO reserved tokens
  */
   function calculateICOLimits() private {    
    uint256 tokensUnspent_preICO = tokenLimitReserved_preICO.sub(tokensMinted_preICO);
    tokenLimitReserved_ico = tokenLimitReserved_ico.add(tokensUnspent_preICO);
  }

  /**
  * @dev preICO finalization logic
  */
  function finalizePreICO(uint256 _tokensMinted_preICO, uint256 _tokensMinted_team, uint256 _tokensMinted_platform, uint256 _tokensMinted_airdrops) private {
    tokensMinted_preICO = _tokensMinted_preICO;
    tokensMinted_team = _tokensMinted_team;
    tokensMinted_platform = _tokensMinted_platform;
    tokensMinted_airdrops = _tokensMinted_airdrops;
    
    calculateICOLimits();
  }

  /**
  * @dev ICO finalization logic
  */
  function finalizeICO() private {
    selfdestruct(owner);
  }
}
