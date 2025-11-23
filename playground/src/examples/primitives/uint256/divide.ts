import * as Uint256 from '../../../../../src/primitives/Uint/index.js';

// Basic division
const a = Uint256.fromNumber(100);
const b = Uint256.fromNumber(10);
const quotient = Uint256.dividedBy(a, b);
console.log('100 / 10 =', Uint256.toNumber(quotient));

// Integer division (truncates)
const c = Uint256.fromNumber(100);
const d = Uint256.fromNumber(3);
const result = Uint256.dividedBy(c, d);
console.log('100 / 3 = 33 (integer division):', Uint256.toNumber(result));

// Divide large numbers
const weiAmount = Uint256.fromBigInt(10n ** 18n); // 1 ETH
const divisor = Uint256.fromBigInt(10n ** 9n); // gwei
const gwei = Uint256.dividedBy(weiAmount, divisor);
console.log('1 ETH in gwei:', Uint256.toBigInt(gwei));

// Divide by one (identity)
const value = Uint256.fromNumber(42);
const identity = Uint256.dividedBy(value, Uint256.ONE);
console.log('42 / 1 = 42:', Uint256.toNumber(identity) === 42);

// Self-division equals one
const self = Uint256.fromNumber(999);
const one = Uint256.dividedBy(self, self);
console.log('n / n = 1:', Uint256.equals(one, Uint256.ONE));
