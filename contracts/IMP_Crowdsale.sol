pragma solidity ^0.4.24;

import "./IMP_Token.sol";
import "../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/zeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";
contract IMP_Crowdsale is WhitelistedCrowdsale {

  IMP_Token public token;

  uint256 icoTotalSupplyLimit;

  /**
   * @dev Constructor function.
   * @param _rate Token amount per one Eth
   * @param _icoTotalSupplyLimit Value in wei involved in the purchase
   */
  constructor(
    uint256 _rate, 
    uint256 _icoTotalSupplyLimit, 
    uint256 _tokenPercentagePurchaseLimit, 
    address _wallet, 
    IMP_Token _token) Crowdsale(_rate, _wallet, _token) public {
    token = IMP_Token(_token);
    icoTotalSupplyLimit = _icoTotalSupplyLimit;
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
}
