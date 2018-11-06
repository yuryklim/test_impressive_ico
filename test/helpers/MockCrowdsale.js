let mock = {
    minimumPurchaseWei: web3.toWei(0.00001, "ether"),
    crowdsaleTypePreICO: 0,
    crowdsaleTypeICO: 1,
    crowdsaleRateEth: 10,
    crowdsaleWallet: 000000,
    crowdsaleTotalSupplyLimit: 100000000,
    // crowdsaleOpening: web3.eth.getBlock("latest").timestamp,
    // crowdsaleClosing: web3.eth.getBlock("latest").timestamp + 10,    //  not calculated
    tokenPercentageReservedPreICO: 30,
    tokenPercentageReservedICO: 44,
    tokenPercentageReservedTeam: 18,
    tokenPercentageReservedPlatform: 5,
    tokenPercentageReservedAirdrops: 2
};
exports.getMock = () => {
    return mock;
} 