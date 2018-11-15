pragma solidity ^0.4.24;

import "./IMP_DiscountCrowdsale.sol";
import "./IMP_TokenNumbersManagedCrowdsale.sol";
import "../node_modules/zeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";
import "../node_modules/zeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "../node_modules/zeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";


contract IMP_Crowdsale is WhitelistedCrowdsale, Pausable, FinalizableCrowdsale, IMP_TokenNumbersManagedCrowdsale {

  uint256 private pendingTokens;  //  tokens calculated for current tx

  /**
   * EVENTS
   */


  /**
   * MODIFIERS
   */


  /**
   * @dev Constructor function.
   * @param _crowdsaleSharedLedger        IMP_CrowdsaleSharedLedger for keeping shared crowdsale info 
   * @param _token                        Token used for crowdsale
   * @param _wallet                       Wallet used for crowdsale
   * @param _timings                      Crowdsale timings:
   * 0 - openingTimestamp
   * 1 - closingTimestamp
   */
  constructor(
    IMP_Token _token, 
    address _crowdsaleSharedLedger, 
    address _wallet, 
    uint256[] _timings,
    uint256 _rateETH
    ) 
    Crowdsale(1, _wallet, _token)
    TimedCrowdsale(_timings[0], _timings[1])
    IMP_TokenNumbersManagedCrowdsale(_crowdsaleSharedLedger, _rateETH)
      public {      
        token = IMP_Token(_token);
  }

  /**
   * @dev Checks whether the period in which the crowdsale is open has already started.
   * @return Whether crowdsale period has started
   */
  function hasOpened() public view returns (bool) {
    return block.timestamp > openingTime;
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
   * @dev Calculates token amount for provided wei amount.
   * @param _weiAmount Value in wei to be converted into tokens
   * @return Number of tokens that can be purchased with the specified _weiAmount
   */
  function calculateTokenAmount(uint256 _weiAmount) public view returns (uint256) {
    require(_weiAmount >= minimumPurchaseWei, "minimum purchase wei not reached");

    return _weiAmount.mul(rateETH).mul(10**4).div(10**18);
    //  TODO: calculate properly
  }




  /**
   * OVERRIDEN
   */

  /**
   * @dev Validation of an incoming purchase. Use require statements to revert state when conditions are not met. Use super to concatenate validations.
   * @param _beneficiary Address performing the token purchase
   * @param _weiAmount Value in wei involved in the purchase
   */
  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal whenNotPaused {
    require(_weiAmount >= minimumPurchaseWei, "minimum purchase wei not reached");

    pendingTokens = _weiAmount.mul(rateETH).mul(10**4).div(10**18);
    //  TODO: calculate properly

    validateMintLimitsForPurchase(pendingTokens);

    super._preValidatePurchase(_beneficiary, _weiAmount);
  }

  /**
   * @dev Override to extend the way in which ether is converted to tokens.
   * @param _weiAmount Value in wei to be converted into tokens
   * @return Number of tokens that can be purchased with the specified _weiAmount
   */
  function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256) {
    require(_weiAmount > 0, "wei should be more, than 0");
    return pendingTokens;
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
   * @dev Override for extensions that require an internal state to check for validity (current user contributions, etc.)
   * @param _beneficiary Address receiving the tokens
   * @param _weiAmount Value in wei involved in the purchase
   */
  function _updatePurchasingState(address _beneficiary, uint256 _weiAmount) internal {
    updateMintedTokenNumbersForCrowdsale(pendingTokens);
    pendingTokens = 0;

    super._updatePurchasingState(_beneficiary, _weiAmount);
  }
  
  /**
   * @dev Determines how ETH is stored/forwarded on purchases.
   * We should not forward funds.
   */
  function _forwardFunds() internal {}

  /**
   * @dev Can be overridden to add finalization logic. The overriding function
   * should call super.finalization() to ensure the chain of finalization is
   * executed entirely.
   */
  function finalization() internal {
    
    super.finalization();
    finalizeCrowdsale();
    selfdestruct(owner);
  }

  /**
   * PRIVATE
   */

  /**
   * @dev Manually token minting.
   * @param _mintPurpose Purpose of minting
   * @param _beneficiary Token receiver address
   * @param _tokenAmount Number of tokens to be minted, eg. 1 token == 1 0000
   */

  function manualMint(MintPurpose _mintPurpose, address _beneficiary, uint256 _tokenAmount) private whenNotPaused {
    require(_tokenAmount > 0, "0 tokens not alowed for minting");

    validateMintLimits(_tokenAmount, _mintPurpose);

    _deliverTokens(_beneficiary, _tokenAmount);
    updateMintedTokenNumbers(_mintPurpose, _tokenAmount);
  }
}