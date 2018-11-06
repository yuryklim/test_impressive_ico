pragma solidity ^0.4.24;

import "./IMP_Token.sol";
import "./IMP_MultiPurposeCrowdsale.sol";
import "../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/zeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";

contract IMP_Crowdsale is WhitelistedCrowdsale, IMP_MultiPurposeCrowdsale {

  IMP_Token internal token;

  //  minimum wei amount for purchase
  uint256 minimumPurchaseWei;
  uint256 rateETH;

  /**
   * EVENTS
   */


  /**
   * MODIFIERS
   */

  /**
   * @dev Constructor function.
   * @param _crowdsaleType                Type of crowdsale
   * @param _minimumPurchaseWei           Minimum wei for purchase
   * @param _rateETH                      Token amount per one Eth
   * @param _wallet                       Wallet used for crowdsale
   * @param _token                        Token used for crowdsale
   * @param _tokenLimitTotalSupply        Token maximum supply
   * @param _tokenPercentageReservations  Token percentage reserved for different usage: 
   * 0 - pre ICO purchase
   * 1 - ICO purchase
   * 2 - team members
   * 3 - platform beginning period
   * 4 - airdrops and bounties
   */
  constructor(
    CrowdsaleType _crowdsaleType, 
    uint256 _minimumPurchaseWei,
    uint256 _rateETH, 
    address _wallet, 
    IMP_Token _token, 
    uint8 _tokenDecimals, 
    uint256 _tokenLimitTotalSupply, 
    uint8[] _tokenPercentageReservations) 
    Crowdsale(1, _wallet, _token) 
    IMP_MultiPurposeCrowdsale(_tokenLimitTotalSupply, _tokenPercentageReservations, _tokenDecimals) 
    public {      
      crowdsaleType = _crowdsaleType;
      token = IMP_Token(_token);
      minimumPurchaseWei = _minimumPurchaseWei;
      rateETH = _rateETH;
  }

  /**
   * @dev Manually token minting.
   * @param _mintPurpose Purpose of minting
   * @param _beneficiary Token receiver address
   * @param _tokenAmount Number of tokens to be minted
   */

  function manualMint(MintPurpose _mintPurpose, address _beneficiary, uint256 _tokenAmount) public onlyOwner {
    
    require(
      _mintPurpose != IMP_MultiPurposeCrowdsale.MintPurpose.preICO 
      && _mintPurpose != IMP_MultiPurposeCrowdsale.MintPurpose.ico, 
      "preICO and ICO purposes can not be used for manual minting");

    validateMintLimits(_tokenAmount, _mintPurpose);

    _deliverTokens(_beneficiary, _tokenAmount);
    updateMintedTokenNumbers(_mintPurpose, _tokenAmount);
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
