pragma solidity ^0.4.24;

import "../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title IMP_DiscountCrowdsale
 * @dev IMP_DiscountCrowdsale is a contract for managing stages and discounts during crowdsale.
 */

/**
 * 1 week = 20%
 * 2 week = 18%
 * 3 week = 16%
 * 4 week = 14%
 * 5 week = 12%
 * 6 week = 10%
 */
contract IMP_DiscountCrowdsale is Ownable {

  using SafeMath for uint256;
  
  //  end of each week in timestamp
  uint256[] private discountEdges;
  
  //  in %
  uint256[] public stageDiscounts;
  uint256[] public stageEdges;  
  
  /**
   *  PUBLIC
   */
  
  constructor(uint256[] _stageDiscounts, uint256[] _weekTimestamps) public {
    require(_stageDiscounts.length > 0, "empty discounts");
    require(_stageDiscounts.length == _weekTimestamps.length.sub(1), "discounts count must be == stages count");
    stageDiscounts = _stageDiscounts;
    intitStageEdges(stageEdges, _weekTimestamps);
  }

  /**
  * @dev Calculate crowdsale discount
  * @return Discount for current stage
  */
  function currentDiscount() public view returns(uint256 discount) {
    for(uint i = 0; i < stageEdges.length; i ++) {
      if(now <= stageEdges[i]) {
        discount = stageDiscounts[i];
        return discount;
      }
    }
  }

  /**
  * @dev Create stageEdges from week timestamps array
  * @param _stageEdges      stages array passed as reference
  * @param _weekTimestamps   crowdsale week timestamps
  */
  function intitStageEdges(uint256[] storage _stageEdges, uint256[] _weekTimestamps) private {
    for(uint i = 0; i < _weekTimestamps.length; i ++) {
      //  exclude first element - crowdsale opening timestamp
      if(i == 0) {
        continue;
      }
      _stageEdges.push(_weekTimestamps[i]);      
    }
  } 
}
