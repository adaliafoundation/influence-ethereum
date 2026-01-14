const BigNumber = require('bignumber.js');

const REAL_FBITS = 64;
const REAL_ONE = new BigNumber(2).pow(REAL_FBITS);

class Math64 {

  static fromReal(real) {
    real = new BigNumber(real.toString());
    return real.div(REAL_ONE).toNumber()
  }

  static toReal(float) {
    if (isNaN(float)) {
      throw new Error("NaN cannot be represented in fixed-point!")
    }

    if (Math.log2(Math.abs(float)) >= 63) {
      throw new Error("Magnitude of " + float + " is too large for 64 bit signed int!")
    }

    return REAL_ONE.times(float.toString()).toFixed(0);
  }
}

module.exports = Math64;
