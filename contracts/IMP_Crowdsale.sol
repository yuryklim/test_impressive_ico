pragma solidity ^0.4.24;

import "./IMP_Token.sol";
import "./IMP_MultiPurposeCrowdsale.sol";
import "../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/zeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";
import "../node_modules/zeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "../node_modules/zeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "./IMP_DiscountCrowdsale.sol";

contract IMP_Crowdsale is WhitelistedCrowdsale, Pausable, TimedCrowdsale, IMP_MultiPurposeCrowdsale, IMP_DiscountCrowdsale  {

  IMP_Token internal token;

  //  minimum wei amount for purchase
  uint256 public minimumPurchaseWei = 10000000000000; //  web3.toWei(0.00001, "ether")
  uint256 public rateETH = 10; // no decimals, TODO: correct values

  /**
   * EVENTS
   */


  /**
   * MODIFIERS
   */

  /**
   * @dev Constructor function.
   * @param _crowdsaleType                Type of crowdsale
   * @param _timings                      Crowdsale timings:
   * 0 - openingTimestamp
   * 1 - closingTimestamp
   * @param _wallet                       Wallet used for crowdsale
   * @param _token                        Token used for crowdsale
   * @param _tokenLimitTotalSupply        Token maximum supply
   * @param _tokenPercentageReservations  Token percentage reserved for different usage: 
   * 0 - pre ICO purchase
   * 1 - ICO purchase
   * 2 - team members
   * 3 - platform beginning period
   * 4 - airdrops and bounties
   * @param _discounts                    Discounts for Crowdsale. Decreasing from max to min
   */
  constructor(
    CrowdsaleType _crowdsaleType, 
    uint256[] _timings, 
    address _wallet, 
    IMP_Token _token, 
    uint256 _tokenLimitTotalSupply, 
    uint8[] _tokenPercentageReservations, 
    uint256[] _discounts) 
    Crowdsale(1, _wallet, _token)
    TimedCrowdsale(_timings[0], _timings[1]) 
    IMP_MultiPurposeCrowdsale(_token, _tokenLimitTotalSupply, _tokenPercentageReservations) 
    IMP_DiscountCrowdsale(_timings[0], _timings[1], _discounts[0], _discounts[1])
    public {      
      crowdsaleType = _crowdsaleType;
      token = IMP_Token(_token);
  }

   /**
   * @dev Calculates token amount for provided wei amount.
   * @param _weiAmount Value in wei to be converted into tokens
   * @return Number of tokens that can be purchased with the specified _weiAmount
   */
  function calculateTokenAmount(uint256 _weiAmount) public view returns (uint256) {
    require(_weiAmount >= minimumPurchaseWei, "minimum purchase wei not reached");
    
    return _getTokenAmount(_weiAmount);
  }

  /**
   *  MANUAL MINTING
   */ 

  /**
   * @dev Manually token minting for team.
   * @param _beneficiary Token receiver address
   * @param _tokenAmount Number of tokens to be minted with decimals, eg. 1 token == 1 0000
   */
  function manualMint_team(address _beneficiary, uint256 _tokenAmount) public onlyOwner {  
    manualMint(MintPurpose.team, _beneficiary, _tokenAmount);
  }

  /**
   * @dev Manually token minting for platform.
   * @param _beneficiary Token receiver address
   * @param _tokenAmount Number of tokens to be minted, eg. 1 token == 1 0000
   */
  function manualMint_platform(address _beneficiary, uint256 _tokenAmount) public onlyOwner {  
    manualMint(MintPurpose.platform, _beneficiary, _tokenAmount);
  }

  /**
   * @dev Manually token minting for airdrops.
   * @param _beneficiary Token receiver address
   * @param _tokenAmount Number of tokens to be minted, eg. 1 token == 1 0000
   */
  function manualMint_airdrops(address _beneficiary, uint256 _tokenAmount) public onlyOwner {  
    manualMint(MintPurpose.airdrops, _beneficiary, _tokenAmount);
  }

  /**
   * @dev Manually token minting.
   * @param _mintPurpose Purpose of minting
   * @param _beneficiary Token receiver address
   * @param _tokenAmount Number of tokens to be minted
   */
  function manualMint(MintPurpose _mintPurpose, address _beneficiary, uint256 _tokenAmount) internal whenNotPaused  {
    
    require(_tokenAmount > 0, "0 tokens not alowed for minting");
    
    require(
      _mintPurpose != IMP_MultiPurposeCrowdsale.MintPurpose.preICO 
      && _mintPurpose != IMP_MultiPurposeCrowdsale.MintPurpose.ico, 
      "preICO and ICO purposes can not be used for manual minting");

    validateMintLimits(_tokenAmount, _mintPurpose);

    _deliverTokens(_beneficiary, _tokenAmount);
    updateMintedTokenNumbers(_mintPurpose, _tokenAmount);
  }

   /**
   * @dev Checks whether the period in which the crowdsale is open has already started.
   * @return Whether crowdsale period has started
   */
  function hasOpened() public view returns (bool) {
    return block.timestamp > openingTime;
  }

  /**
   * OVERRIDEN
   */

  /**
   * @dev Validation of an incoming purchase. Use require statements to revert state when conditions are not met. Use super to concatenate validations.
   * @param _beneficiary Address performing the token purchase
   * @param _weiAmount Value in wei involved in the purchase
   */
  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal whenNotPaused  {
    
    require(_weiAmount >= minimumPurchaseWei, "minimum purchase wei not reached");
    
    pendingTokens = _getTokenAmount(_weiAmount);
    
    MintPurpose mintPurpose = (crowdsaleType == CrowdsaleType.preICO) ? MintPurpose.preICO : MintPurpose.ico;
    validateMintLimits(pendingTokens, mintPurpose);

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
    return _weiAmount.mul(rateETH).mul(10**uint256(token.decimals())).div(10**18);
  }

  /**
   * @dev Override for extensions that require an internal state to check for validity (current user contributions, etc.)
   * @param _beneficiary Address receiving the tokens
   * @param _weiAmount Value in wei involved in the purchase
   */
  function _updatePurchasingState(address _beneficiary, uint256 _weiAmount) internal {
    updateMintedTokenNumbersForCrowdsale(crowdsaleType, pendingTokens);
    super._updatePurchasingState(_beneficiary, _weiAmount);
  }

  /**
   * @dev Determines how ETH is stored/forwarded on purchases.
   * We should not forward funds.
   */
  function _forwardFunds() internal { }

  /**
   * PRIVATE
   */

}
