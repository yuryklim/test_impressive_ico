let mock = {
    minimumPurchaseWei: web3.toWei(0.00001, "ether"),
    crowdsaleRateEth: 100, // tokens per ETH, no decimals, TODO: correct values
    crowdsaleWallet: 000000,
    crowdsaleTotalSupplyLimit: 100000000, //  no decimals
    crowdsalePreICODiscounts: [20, 18, 16, 14, 12, 10], //  including each edge
    crowdsaleICODiscounts: [10, 9, 8, 7, 6, 5, 4, 3], //  including each edge
    tokenPercentageReservedPreICO: 30,
    tokenPercentageReservedICO: 44,
    tokenPercentageReservedTeam: 18,
    tokenPercentageReservedPlatform: 5,
    tokenPercentageReservedAirdrops: 2
};
exports.getMock = () => {
    return mock;
} 