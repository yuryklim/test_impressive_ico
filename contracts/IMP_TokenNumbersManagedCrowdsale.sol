pragma solidity ^0.4.24;


import "./IMP_CrowdsaleSharedLedger.sol";
import "../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";


contract IMP_TokenNumbersManagedCrowdsale is Ownable {
  using SafeMath for uint256;  

  enum MintPurpose {preICO, ico, team, platform, airdrops} // Supplier.State.inactive

  //  minimum wei amount for purchase
  uint256 public minimumPurchaseWei = 10000000000000; //  web3.toWei(0.00001, "ether")
  uint256 public rateETH = 10; //tokens per ETH, no decimals, TODO: correct values


  uint256 public tokenLimitReserved_purchase;     //  tokens reserved for purchase
  uint256 public tokenLimitReserved_team;         //  tokens reserved for team
  uint256 public tokenLimitReserved_platform;     //  tokens reserved for platform 
  uint256 public tokenLimitReserved_airdrops;     //  tokens reserved for airdrops

  uint256 public tokensMinted_purchase;     //  tokens minted for purchase
  uint256 public tokensMinted_team;         //  tokens minted for team
  uint256 public tokensMinted_platform;     //  tokens minted for platform 
  uint256 public tokensMinted_airdrops;     //  tokens minted for airdrops

  IMP_CrowdsaleSharedLedger private crowdsaleSharedLedger;


  /**
   * EVENTS
   */

  
  constructor(address _crowdsaleSharedLedger) public {
        crowdsaleSharedLedger  = IMP_CrowdsaleSharedLedger(_crowdsaleSharedLedger);

        getTokenReservedLimits();
  }

  /**
   * @dev Calculate available amount of tokens to mint during purchase.
   * @return Number of tokens that can be minted during purchase
   */
  function tokensAvailableToMint_purchase() public view returns(uint256) {
    return tokenLimitReserved_purchase.sub(tokensMinted_purchase);
  }

  /**
   * @dev Calculate available amount of tokens to mint for team.
   * @return Number of tokens that can be minted for team members
   */
  function tokensAvailableToMint_team() public view onlyOwner returns(uint256) {
    return tokenLimitReserved_team.sub(tokensMinted_team);
  }

  /**
   * @dev Calculate available amount of tokens to mint for platform.
   * @return Number of tokens that can be minted for platform
   */
  function tokensAvailableToMint_platform() public view onlyOwner returns(uint256) {
    return tokenLimitReserved_platform.sub(tokensMinted_platform);
  }

  /**
   * @dev Calculate available amount of tokens to mint for airdrops.
   * @return Number of tokens that can be minted for airdrops
   */
  function tokensAvailableToMint_airdrops() public view onlyOwner returns(uint256) {
    return tokenLimitReserved_airdrops.sub(tokensMinted_airdrops);
  }

   /**
   * @dev Add finalization logic.
   */
  function finalizeCrowdsale() internal onlyOwner {
     crowdsaleSharedLedger.finalizeCrowdsale();
  }


  /**
   * INTERNAL
   */

   /**
   * @dev Validation of crowdsale limits for preICO and ICO only.
   * @param _pendingTokens Number of tokens which are going to be purchased
   */
  function validateMintLimitsForPurchase(uint256 _pendingTokens) internal view {
    MintPurpose mintPurpose = (crowdsaleSharedLedger.crowdsaleType() == IMP_CrowdsaleSharedLedger.CrowdsaleType.preICO) ? MintPurpose.preICO : MintPurpose.ico;
    validateMintLimits(_pendingTokens, mintPurpose);
  }

  /**
   * @dev Validation of crowdsale limits.
   * @param _pendingTokens Number of tokens which are going to be purchased
   * @param _mintPurpose Purpose of minting
   */
  function validateMintLimits(uint256 _pendingTokens, MintPurpose _mintPurpose) internal view {      
    if (_mintPurpose == MintPurpose.team) {
      require(tokensAvailableToMint_team() >= _pendingTokens, "not enough tokens for team");
    }  else if (_mintPurpose == MintPurpose.platform) {
      require(tokensAvailableToMint_platform() >= _pendingTokens, "not enough tokens for platform");
    } else if (_mintPurpose == MintPurpose.airdrops) {
      require(tokensAvailableToMint_airdrops() >= _pendingTokens, "not enough tokens for airdrops");
    } else {
      require(tokensAvailableToMint_purchase() >= _pendingTokens, "not enough tokens for tokensAvailableToMint_purchase");
    }
  }

  /**
   * @dev Update token mined numbers after minting.
   * @param _mintPurpose Purpose of minting
   * @param _tokenAmount Number of tokens were minted
   */
  function updateMintedTokenNumbers(MintPurpose _mintPurpose, uint256 _tokenAmount) internal {
     if (_mintPurpose == MintPurpose.team) {
      tokensMinted_team = tokensMinted_team.add(_tokenAmount);
    } else if (_mintPurpose == MintPurpose.platform) {
      tokensMinted_platform = tokensMinted_platform.add(_tokenAmount);
    } else if (_mintPurpose == MintPurpose.airdrops) {
      tokensMinted_airdrops = tokensMinted_airdrops.add(_tokenAmount);
    } else {
      tokensMinted_purchase = tokensMinted_purchase.add(_tokenAmount);
    }
  }

  /**
   * @dev Update token mined numbers after minting.
   * @param _tokenAmount Number of tokens were minted
   */
  function updateMintedTokenNumbersForCrowdsale(uint256 _tokenAmount) internal {
    MintPurpose mintPurpose = (crowdsaleSharedLedger.crowdsaleType() == IMP_CrowdsaleSharedLedger.CrowdsaleType.preICO) ? MintPurpose.preICO : MintPurpose.ico;
    updateMintedTokenNumbers(mintPurpose, _tokenAmount);
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