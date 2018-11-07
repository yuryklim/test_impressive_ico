pragma solidity ^0.4.24;

import "../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./IMP_Token.sol";

contract IMP_MultiPurposeCrowdsale is Ownable {

  using SafeMath for uint256;

  enum MintPurpose {preICO, ico, team, platform, airdrops} // Supplier.State.inactive
  enum CrowdsaleType {preICO, ico}

  CrowdsaleType public crowdsaleType;
  uint256 internal pendingTokens;  //  tokens calculated for current tx

  uint8 public tokenPercentageReserved_preICO;    //  % of tokens reserved for pre_ICO
  uint8 public tokenPercentageReserved_ico;       //  % of tokens reserved for ICO
  uint8 public tokenPercentageReserved_team;      //  % of tokens reserved for team
  uint8 public tokenPercentageReserved_platform;  //  % of tokens reserved for platform 
  uint8 public tokenPercentageReserved_airdrops;  //  % of tokens reserved for airdrops
  
  uint256 public tokenLimitTotalSupply_crowdsale; //  tokens total supply for entire crowdsale
  uint256 public tokenLimitReserved_preICO;       //  tokens reserved for pre_ICO
  uint256 public tokenLimitReserved_ico;          //  tokens reserved for ICO
  uint256 public tokenLimitReserved_team;         //  tokens reserved for team
  uint256 public tokenLimitReserved_platform;     //  tokens reserved for platform 
  uint256 public tokenLimitReserved_airdrops;     //  tokens reserved for airdrops

  uint256 public tokensMinted_preICO;    //  tokens minted for pre_ICO
  uint256 public tokensMinted_ico;       //  tokens minted for ICO
  uint256 public tokensMinted_team;      //  tokens minted for team
  uint256 public tokensMinted_platform;  //  tokens minted for platform 
  uint256 public tokensMinted_airdrops;  //  tokens minted for airdrops

  /**
   * EVENTS
   */
   event ErrorWhileUpdateMintedTokenNumbersForCrowdsale(CrowdsaleType _crowdsaleType, uint256 _tokenAmount);
   event ErrorWhileUpdateMintedTokenNumbers(MintPurpose _mintPurpose, uint256 _tokenAmount);
  
  
  /**
   * @dev Constructor function.
   * @param _token                        Token used in Crowdsale
   * @param _tokenLimitTotalSupply        Token maximum supply
   * @param _tokenPercentageReservations  Token percentage reserved for different usage: 
   * 0 - pre ICO purchase
   * 1 - ICO purchase
   * 2 - team members
   * 3 - platform beginning period
   * 4 - airdrops and bounties 
   */
  constructor(IMP_Token _token, uint256 _tokenLimitTotalSupply, uint8[] _tokenPercentageReservations) public {
      tokenLimitTotalSupply_crowdsale = _tokenLimitTotalSupply.mul(10**uint256(_token.decimals()));
      tokenPercentageReserved_preICO = _tokenPercentageReservations[0];
      tokenPercentageReserved_ico = _tokenPercentageReservations[1];
      tokenPercentageReserved_team = _tokenPercentageReservations[2];
      tokenPercentageReserved_platform = _tokenPercentageReservations[3];
      tokenPercentageReserved_airdrops = _tokenPercentageReservations[4];
      tokenLimitReserved_preICO = tokenLimitTotalSupply_crowdsale.mul(tokenPercentageReserved_preICO).div(100);
      tokenLimitReserved_ico = tokenLimitTotalSupply_crowdsale.mul(tokenPercentageReserved_ico).div(100);
      tokenLimitReserved_team = tokenLimitTotalSupply_crowdsale.mul(tokenPercentageReserved_team).div(100);
      tokenLimitReserved_platform = tokenLimitTotalSupply_crowdsale.mul(tokenPercentageReserved_platform).div(100);
      tokenLimitReserved_airdrops = tokenLimitTotalSupply_crowdsale.mul(tokenPercentageReserved_airdrops).div(100);
  }

  /**
   * @dev Calculate available amount of token to mint during preICO.
   * @return Number of tokens that can be minted during preICO
   */
  function tokensAvailableToMint_preICO() public view returns(uint256) {
    return tokenLimitReserved_preICO.sub(tokensMinted_preICO);
  }

  /**
   * @dev Calculate available amount of token to mint during ICO.
   * @return Number of tokens that can be minted during ICO
   */
  function tokensAvailableToMint_ico() public view returns(uint256) {
    return tokenLimitReserved_ico.sub(tokensMinted_ico);
  }

  /**
   * @dev Calculate available amount of token to mint for team.
   * @return Number of tokens that can be minted for team members
   */
  function tokensAvailableToMint_team() public view onlyOwner returns(uint256) {
    return tokenLimitReserved_team.sub(tokensMinted_team);
  }

  /**
   * @dev Calculate available amount of token to mint for platform.
   * @return Number of tokens that can be minted for platform
   */
  function tokensAvailableToMint_platform() public view onlyOwner returns(uint256) {
    return tokenLimitReserved_platform.sub(tokensMinted_platform);
  }

  /**
   * @dev Calculate available amount of token to mint for airdrops.
   * @return Number of tokens that can be minted for airdrops
   */
  function tokensAvailableToMint_airdrops() public view onlyOwner returns(uint256) {
    return tokenLimitReserved_airdrops.sub(tokensMinted_airdrops);
  }

  /**
  * INTERNAL
  */

   /**
   * @dev Update token mined numbers after minting.
   * @param _crowdsaleType Purpose of minting
   * @param _tokenAmount Number of tokens were minted
   */
  function updateMintedTokenNumbersForCrowdsale(CrowdsaleType _crowdsaleType, uint256 _tokenAmount) internal {
    if(_crowdsaleType == CrowdsaleType.preICO) {
      updateMintedTokenNumbers(MintPurpose.preICO, _tokenAmount);
    } else if(_crowdsaleType == CrowdsaleType.ico) {
      updateMintedTokenNumbers(MintPurpose.ico, _tokenAmount);
    } else {
      emit ErrorWhileUpdateMintedTokenNumbersForCrowdsale(_crowdsaleType, _tokenAmount);
      revert();
    }
  }

  
  /**
   * @dev Validation of crowdsale limits.
   * @param _pendingTokens Number of tokens which are going to be purchased
   * @param _mintPurpose Purpose of minting
   */
  function validateMintLimits(uint256 _pendingTokens, MintPurpose _mintPurpose) internal view {      
    if(_mintPurpose == MintPurpose.preICO) {
      require(tokensAvailableToMint_preICO() >= _pendingTokens, "not enough tokens for preICO");
    } else if (_mintPurpose == MintPurpose.ico) {
      require (tokensAvailableToMint_ico() >= _pendingTokens, "not enough tokens for ico");
    } else if (_mintPurpose == MintPurpose.team) {
      require(tokensAvailableToMint_team() >= _pendingTokens, "not enough tokens for team");
    }  else if (_mintPurpose == MintPurpose.platform) {
      require(tokensAvailableToMint_platform() >= _pendingTokens, "not enough tokens for platform");
    } else if (_mintPurpose == MintPurpose.airdrops) {
      require(tokensAvailableToMint_airdrops() >= _pendingTokens, "not enough tokens for airdrops");
    } else {
      revert();
    }
  }
  
  /**
   * @dev Update token mined numbers after minting.
   * @param _mintPurpose Purpose of minting
   * @param _tokenAmount Number of tokens were minted
   */
  function updateMintedTokenNumbers(MintPurpose _mintPurpose, uint256 _tokenAmount) internal {
    if (_mintPurpose == MintPurpose.preICO) {
      tokensMinted_preICO = tokensMinted_preICO.add(_tokenAmount);
    } else if (_mintPurpose == MintPurpose.ico) {
      tokensMinted_ico = tokensMinted_ico.add(_tokenAmount);
    } else if (_mintPurpose == MintPurpose.team) {
      tokensMinted_team = tokensMinted_team.add(_tokenAmount);
    }  else if (_mintPurpose == MintPurpose.platform) {
      tokensMinted_platform = tokensMinted_platform.add(_tokenAmount);
    } else if (_mintPurpose == MintPurpose.airdrops) {
      tokensMinted_airdrops = tokensMinted_airdrops.add(_tokenAmount);
    } else {
      emit ErrorWhileUpdateMintedTokenNumbers(_mintPurpose, _tokenAmount);
      revert();
    }
  }
}
