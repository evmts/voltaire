import { Uint256 } from "@tevm/voltaire";
// Basic multiplication
const a = Uint256.fromNumber(10);
const b = Uint256.fromNumber(20);
const product = Uint256.times(a, b);

// Multiply by powers of 10
const value = Uint256.fromBigInt(123n);
const factor = Uint256.fromBigInt(10n ** 18n);
const scaled = Uint256.times(value, factor);

// Overflow wrapping
const large = Uint256.fromBigInt(2n ** 200n);
const overflow = Uint256.times(large, Uint256.fromBigInt(2n ** 100n));

// Multiply by zero
const zero = Uint256.times(Uint256.fromNumber(999), Uint256.ZERO);

// Multiply by one (identity)
const identity = Uint256.times(Uint256.fromNumber(42), Uint256.ONE);

// Product of array
const values = [
	Uint256.fromNumber(2),
	Uint256.fromNumber(3),
	Uint256.fromNumber(5),
];
const total = Uint256.product(values);
