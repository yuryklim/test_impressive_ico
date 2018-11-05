pragma solidity ^0.4.24;

import "./IMP_Token.sol";
import "../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/zeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";

contract IMP_Crowdsale is WhitelistedCrowdsale {

  enum CrowdsaleType {preICO, ico}
  enum MintPurpose {preICO, ico, team, platform, airdrops} // Supplier.State.inactive

  IMP_Token public token;

  CrowdsaleType public crowdsaleType;

  uint8 public tokenPercentageReserved_preICO;  //  % of tokens reserved for pre_ICO
  uint8 public tokenPercentageReserved_ico;       //  % of tokens reserved for ICO
  uint8 public tokenPercentageReserved_team;      //  % of tokens reserved for team
  uint8 public tokenPercentageReserved_platform;  //  % of tokens reserved for platform 
  uint8 public tokenPercentageReserved_airdrops;  //  % of tokens reserved for airdrops

  uint256 public tokenLimitTotalSupply_crowdsale; //  tokens total supply for entire crowdsale
  uint256 public tokenLimitReserved_preICO;    //  tokens reserved for pre_ICO
  uint256 public tokenLimitReserved_ico;       //  tokens reserved for ICO
  uint256 public tokenLimitReserved_team;      //  tokens reserved for team
  uint256 public tokenLimitReserved_platform;  //  tokens reserved for platform 
  uint256 public tokenLimitReserved_airdrops;  //  tokens reserved for airdrops

  uint256 public tokensMinted_preICO;    //  tokens minted for pre_ICO
  uint256 public tokensMinted_ico;       //  tokens minted for ICO
  uint256 public tokensMinted_team;      //  tokens minted for team
  uint256 public tokensMinted_platform;  //  tokens minted for platform 
  uint256 public tokensMinted_airdrops;  //  tokens minted for airdrops

  /**
   * MODIFIERS
   */

   /**
   * PUBLIC
   */

   /**
   * @dev Constructor function.
   * @param _rate Token amount per one Eth
   */
    constructor(
      CrowdsaleType _crowdsaleType, 
      uint256 _rate, 
      address _wallet, 
      IMP_Token _token, 
      uint256 _tokenLimitTotalSupply, 
      uint8 _tokenPercentageReserved_preICO, 
      uint8 _tokenPercentageReserved_ico, 
      uint8 _tokenPercentageReserved_team, 
      uint8 _tokenPercentageReserved_platform, 
      uint8 _tokenPercentageReserved_airdrops) Crowdsale(_rate, _wallet, _token) public {
    crowdsaleType = _crowdsaleType;
    token = IMP_Token(_token);

    uint8 decimals = token.decimals();
    tokenLimitTotalSupply_crowdsale = _tokenLimitTotalSupply.mul(10**uint256(decimals));

    tokenPercentageReserved_preICO = _tokenPercentageReserved_preICO;
    tokenPercentageReserved_ico = _tokenPercentageReserved_ico;
    tokenPercentageReserved_team = _tokenPercentageReserved_team;
    tokenPercentageReserved_platform = _tokenPercentageReserved_platform;
    tokenPercentageReserved_airdrops = _tokenPercentageReserved_airdrops;

    tokenLimitReserved_preICO = tokenLimitTotalSupply_crowdsale.mul(_tokenPercentageReserved_preICO).div(100);
    tokenLimitReserved_ico = tokenLimitTotalSupply_crowdsale.mul(_tokenPercentageReserved_ico).div(100);
    tokenLimitReserved_team = tokenLimitTotalSupply_crowdsale.mul(_tokenPercentageReserved_team).div(100);
    tokenLimitReserved_platform = tokenLimitTotalSupply_crowdsale.mul(_tokenPercentageReserved_platform).div(100);
    tokenLimitReserved_airdrops = tokenLimitTotalSupply_crowdsale.mul( _tokenPercentageReserved_airdrops).div(100);
    }

  /**
   * OVERRIDEN
   */

  /**
   * @dev Validation of an incoming purchase. Use require statements to revert state when conditions are not met. Use super to concatenate validations.
   * @param _beneficiary Address performing the token purchase
   * @param _weiAmount Value in wei involved in the purchase
   */
  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    validateMintLimits(_weiAmount, crowdsaleType);
    super._preValidatePurchase(_beneficiary, _weiAmount);
  }
   
  /**
   * @dev Source of tokens. Override this method to modify the way in which the crowdsale ultimately gets and sends its tokens.
   * @param _beneficiary Address performing the token purchase
   * @param _tokenAmount Number of tokens to be emitted
   */
  function _deliverTokens(address _beneficiary, uint256 _tokenAmount) internal {
    token.mint(_beneficiary, _tokenAmount);
  }

  /**
   * @dev Override to extend the way in which ether is converted to tokens.
   * @param _weiAmount Value in wei to be converted into tokens
   * @return Number of tokens that can be purchased with the specified _weiAmount
   */
  function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256) {
    return _weiAmount.mul(rate);
  }

  /**
   * PRIVATE
   */

   /**
   * @dev Validation of crowdsale limits.
   * @param _weiAmount Value in wei to be calculated
   * @param _crowdsaleType Type of current crowdsale
   */
  function validateMintLimits(uint256 _weiAmount, CrowdsaleType _crowdsaleType) private view {
    uint256 pendingTokens = _getTokenAmount(_weiAmount);
      if(_crowdsaleType == CrowdsaleType.preICO) {
       require(tokensMinted_preICO.add(pendingTokens) <= tokenLimitReserved_preICO);
      } else if(_crowdsaleType == CrowdsaleType.ico) {
        require(tokensMinted_ico.add(pendingTokens) <= tokenLimitReserved_ico);
        } else {
          revert();
        }
     
  }
}
