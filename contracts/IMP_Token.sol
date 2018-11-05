pragma solidity ^0.4.24;

import "../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "../node_modules/zeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";

contract IMP_Token is MintableToken, DetailedERC20 {
  using SafeMath for uint256;

  struct Crowdsale {
    uint256 crowdsaleTotalSupplyLimit;  //  tokens total supply
    uint256 preICOTotalSupplyLimit; //  % for pre_ICO
    uint256 icoTotalSupplyLimit;  //  % for ICO
    uint256 teamSupplyReserved; //  tokens reserved for team
    uint256 platformSupplyReserved; //  tokens reserved for platform
  }

  Crowdsale public crowdsale;

  constructor(
    string _name, 
    string _symbol,
    uint8 _decimals, 
    uint256 _crowdsaleTotalSupplyLimit,
    uint8 _preICOTotalSupplyLimitPercent,
    uint8 _icoTotalSupplyLimitPercent, 
    uint8 _teamSupplyReservedPercent, 
    uint8 _platformSupplyReservedPercent)
    DetailedERC20(_name, _symbol, _decimals) public {
    uint256 preICOTotalSupplyLimit = _crowdsaleTotalSupplyLimit.mul(_preICOTotalSupplyLimitPercent).div(100);
    uint256 icoTotalSupplyLimit = _crowdsaleTotalSupplyLimit.mul(_icoTotalSupplyLimitPercent).div(100);
    uint256 teamSupplyReserved = _crowdsaleTotalSupplyLimit.mul(_teamSupplyReservedPercent).div(100);
    uint256 platformSupplyReserved = _crowdsaleTotalSupplyLimit.mul(_platformSupplyReservedPercent).div(100);

    crowdsale = Crowdsale({
      crowdsaleTotalSupplyLimit: _crowdsaleTotalSupplyLimit, 
      preICOTotalSupplyLimit: preICOTotalSupplyLimit, 
      icoTotalSupplyLimit: icoTotalSupplyLimit, 
      teamSupplyReserved: teamSupplyReserved, 
      platformSupplyReserved: platformSupplyReserved});
  }

    /**
     * OVERRIDEN
     */

    function mint(address _to, uint256 _amount) onlyOwner canMint public returns (bool) {
      super.mint(_to, _amount);
    }
}
