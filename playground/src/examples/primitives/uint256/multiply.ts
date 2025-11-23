import * as Uint256 from "../../../../../src/primitives/Uint/index.js";

// Basic multiplication
const a = Uint256.fromNumber(10);
const b = Uint256.fromNumber(20);
const product = Uint256.times(a, b);
console.log("10 * 20 =", Uint256.toNumber(product));

// Multiply by powers of 10
const value = Uint256.fromBigInt(123n);
const factor = Uint256.fromBigInt(10n ** 18n);
const scaled = Uint256.times(value, factor);
console.log("123 * 10^18 =", Uint256.toBigInt(scaled));

// Overflow wrapping
const large = Uint256.fromBigInt(2n ** 200n);
const overflow = Uint256.times(large, Uint256.fromBigInt(2n ** 100n));
console.log("Overflow wraps around:", Uint256.toHex(overflow));

// Multiply by zero
const zero = Uint256.times(Uint256.fromNumber(999), Uint256.ZERO);
console.log("Anything * 0 = 0:", Uint256.isZero(zero));

// Multiply by one (identity)
const identity = Uint256.times(Uint256.fromNumber(42), Uint256.ONE);
console.log("42 * 1 = 42:", Uint256.toNumber(identity) === 42);

// Product of array
const values = [
	Uint256.fromNumber(2),
	Uint256.fromNumber(3),
	Uint256.fromNumber(5),
];
const total = Uint256.product(values);
console.log("2 * 3 * 5 =", Uint256.toNumber(total));
