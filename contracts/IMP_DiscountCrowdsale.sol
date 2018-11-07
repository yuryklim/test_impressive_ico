pragma solidity ^0.4.24;

import "../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title IMP_DiscountCrowdsale
 * @dev IMP_DiscountCrowdsale is a contract for managing discounts during crowdsale.
 */
contract IMP_DiscountCrowdsale is Ownable {

  using SafeMath for uint256;
  
  //  end of each week in timestamp
  uint256[] private discountEdges;
  
  //  discount for each discount edge
  mapping (uint8 => uint256) private discounts;
  
  /**
   *  PUBLIC
   */
  
  constructor(
    uint256 _openingTime, 
    uint256 _closingTime, 
    uint256 _maxDiscount, 
    uint256 _minDiscount) public {
    initDiscountEdges(_openingTime, _closingTime);
    initDiscounts(_maxDiscount, _minDiscount);
  }

  function currentDiscount() public view returns(uint256) {
    for (uint8 index = 0; index < discountEdges.length; index++) {
      if(now < discountEdges[index]) {
        return discounts[index];
      }
    }
  }

  /**
   *  PRIVATE
   */

  function initDiscountEdges(uint256 _openingTime, uint256 _closingTime) private {
   
    uint256 week = 604800;
   
    uint256 nextTimestamp = _openingTime;
   
    while(nextTimestamp.add(week) <= _closingTime) {
      nextTimestamp = nextTimestamp.add(week);
      discountEdges.push(nextTimestamp);
    }
   
    require(nextTimestamp == _closingTime, "Wrong _openingTime and _closingTime relation");
  
  }
  
  function initDiscounts(uint256 _maxDiscount, uint256 _minDiscount) private {
    
    uint8 discountEdgesLength = uint8(discountEdges.length);
    
    uint256 discountDiff = _maxDiscount - _minDiscount;
    
    uint256 discountStep = discountDiff / (discountEdgesLength - 1);
    
    discounts[0] = _maxDiscount;
    
    for (uint8 index = 1; index < discountEdgesLength; index++) {
      discounts[index] = _maxDiscount - (discountStep * index);
    }
    
    require(discounts[discountEdgesLength - 1] == _minDiscount, "wrong last discount");
  
  }
}
