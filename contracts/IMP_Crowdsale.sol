pragma solidity ^0.4.24;

import "./IMP_DiscountCrowdsale.sol";
import "./IMP_CrowdsaleSharedLedger.sol";
import "../node_modules/zeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";
import "../node_modules/zeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "../node_modules/zeppelin-solidity/contracts/lifecycle/Pausable.sol";


contract IMP_Crowdsale is WhitelistedCrowdsale, Pausable, TimedCrowdsale {

  IMP_Token internal token;
  IMP_CrowdsaleSharedLedger private crowdsaleSharedLedger;

  //  minimum wei amount for purchase
  uint256 public minimumPurchaseWei = 10000000000000; //  web3.toWei(0.00001, "ether")
  uint256 public rateETH = 10; // no decimals, TODO: correct values


  uint256 public tokenLimitReserved_purchase;     //  tokens reserved for purchase
  uint256 public tokenLimitReserved_team;         //  tokens reserved for team
  uint256 public tokenLimitReserved_platform;     //  tokens reserved for platform 
  uint256 public tokenLimitReserved_airdrops;     //  tokens reserved for airdrops

  uint256 public tokensMinted_purchase;     //  tokens minted for purchase
  uint256 public tokensMinted_team;         //  tokens minted for team
  uint256 public tokensMinted_platform;     //  tokens minted for platform 
  uint256 public tokensMinted_airdrops;     //  tokens minted for airdrops

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
  constructor(IMP_Token _token, address _crowdsaleSharedLedger, address _wallet, uint256[] _timings) 
    Crowdsale(1, _wallet, _token)
    TimedCrowdsale(_timings[0], _timings[1])
      public {      
        token = IMP_Token(_token);
        crowdsaleSharedLedger  = IMP_CrowdsaleSharedLedger(_crowdsaleSharedLedger);

        getTokenReservedLimits();
  }

  /**
   * @dev Checks whether the period in which the crowdsale is open has already started.
   * @return Whether crowdsale period has started
   */
  function hasOpened() public view returns (bool) {
    return block.timestamp > openingTime;
  }


  /**
   * PRIVATE
   */

  /**
   * @dev Get token reserved limits for current crowdsale.
   */
  function getTokenReservedLimits() private {
    (tokenLimitReserved_purchase, tokenLimitReserved_team, tokenLimitReserved_platform, tokenLimitReserved_airdrops) = crowdsaleSharedLedger.getTokenReservedLimits();
  }
}
