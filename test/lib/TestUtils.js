const InflueceUtilsMock = artifacts.require('InfluenceUtilsMock');

contract('InfluenceUtils', (accounts) => {
  let contract;

  before(async function () {  
    contract = await InflueceUtilsMock.new();
  });

  describe('packFeatures', function () { 
    it('should pack the features', async function () {
      let result = await contract.packFeatures([1, 2, 3, 4, 5, 6]);
      assert.equal(result, 8769009825686829344143713963726968737698330705921n);
  
      result = await contract.packFeatures([2192,325,14,19543,30274,5432]);
      assert.equal(result, 7938876904283173029395263034221578432169433626577040n);
    });
  });
  
  describe('strToUint', function () { 
    it('should convert the string to an int', async function () {
      let res = await contract.strToUint('Foo');
      assert.equal(res, BigInt(4616047))
    });
  });
});
