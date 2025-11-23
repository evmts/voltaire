import * as Uint256 from '../../../../../src/primitives/Uint/index.js';

// Basic exponentiation
const base = Uint256.fromNumber(2);
const exp = Uint256.fromNumber(10);
const result = Uint256.toPower(base, exp);
console.log('2^10 =', Uint256.toNumber(result));

// Square a number
const value = Uint256.fromNumber(12);
const squared = Uint256.toPower(value, Uint256.fromNumber(2));
console.log('12^2 =', Uint256.toNumber(squared));

// Cube a number
const cubed = Uint256.toPower(Uint256.fromNumber(5), Uint256.fromNumber(3));
console.log('5^3 =', Uint256.toNumber(cubed));

// Power of 0 equals 1
const zero = Uint256.toPower(Uint256.fromNumber(42), Uint256.ZERO);
console.log('42^0 = 1:', Uint256.equals(zero, Uint256.ONE));

// Power of 1 (identity)
const one = Uint256.toPower(Uint256.fromNumber(42), Uint256.ONE);
console.log('42^1 = 42:', Uint256.toNumber(one) === 42);

// Large power (with overflow wrapping)
const largePower = Uint256.toPower(Uint256.fromNumber(2), Uint256.fromNumber(100));
console.log('2^100 (wraps on overflow):', Uint256.toHex(largePower));
