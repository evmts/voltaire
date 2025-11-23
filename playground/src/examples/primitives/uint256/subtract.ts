import * as Uint256 from '../../../../../src/primitives/Uint/index.js';

// Basic subtraction
const a = Uint256.fromNumber(200);
const b = Uint256.fromNumber(100);
const diff = Uint256.minus(a, b);
console.log('200 - 100 =', Uint256.toNumber(diff));

// Subtraction with large numbers
const balance = Uint256.fromBigInt(10n ** 18n); // 1 ETH
const fee = Uint256.fromBigInt(10n ** 16n); // 0.01 ETH
const remaining = Uint256.minus(balance, fee);
console.log('1 ETH - 0.01 ETH =', Uint256.toBigInt(remaining));

// Underflow wrapping (wraps to MAX)
const zero = Uint256.ZERO;
const one = Uint256.ONE;
const underflow = Uint256.minus(zero, one);
console.log('0 - 1 wraps to MAX:', Uint256.equals(underflow, Uint256.MAX));

// Subtract to zero
const value = Uint256.fromNumber(42);
const result = Uint256.minus(value, value);
console.log('42 - 42 = 0:', Uint256.isZero(result));
