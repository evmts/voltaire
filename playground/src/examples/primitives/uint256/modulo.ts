import * as Uint256 from '../../../../../src/primitives/Uint/index.js';

// Basic modulo operation
const a = Uint256.fromNumber(10);
const b = Uint256.fromNumber(3);
const remainder = Uint256.modulo(a, b);
console.log('10 % 3 =', Uint256.toNumber(remainder));

// Check if even (mod 2)
const value = Uint256.fromNumber(42);
const isEven = Uint256.isZero(Uint256.modulo(value, Uint256.fromNumber(2)));
console.log('42 is even:', isEven);

// Modulo with large numbers
const large = Uint256.fromBigInt(123456789012345678901234567890n);
const divisor = Uint256.fromBigInt(10n ** 18n);
const mod = Uint256.modulo(large, divisor);
console.log('Large number modulo 10^18:', Uint256.toBigInt(mod));

// Modulo by 1 always returns 0
const zero = Uint256.modulo(Uint256.fromNumber(999), Uint256.ONE);
console.log('Any value % 1 = 0:', Uint256.isZero(zero));

// Get last digit (mod 10)
const number = Uint256.fromNumber(12345);
const lastDigit = Uint256.modulo(number, Uint256.fromNumber(10));
console.log('Last digit of 12345:', Uint256.toNumber(lastDigit));
