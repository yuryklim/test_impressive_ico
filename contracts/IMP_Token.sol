pragma solidity ^0.4.24;

import "../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "../node_modules/zeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";

contract IMP_Token is MintableToken, DetailedERC20 {
  using SafeMath for uint256;

  constructor(string _name, string _symbol, uint8 _decimals) 
    DetailedERC20(_name, _symbol, _decimals) public {
  }
}
