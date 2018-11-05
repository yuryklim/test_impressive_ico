
let IMP_Token = artifacts.require("./IMP_Token.sol");

let token;
contract('IMP_Token', (accounts) => {

  before("setup", async () => {
    token = await IMP_Token.deployed();
  });

  it("should validate token name after migration", async () => {
    assert.equal(await token.name.call(), "Impressive Token", "wrong token name");
  });

  it("should validate token symbol after migration", async () => {
    assert.equal(await token.symbol.call(), "IMP", "wrong token symbol");
  });

  it("should validate token decimals after migration", async () => {
    assert.equal(await token.decimals.call(), 4, "wrong token decimals");
  });

  it("should validate token totalSupply after migration", async () => {
    assert.equal(await token.totalSupply.call(), 0, "wrong token totalSupply");
  });
});
