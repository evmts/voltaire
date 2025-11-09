/**
 * Example: Uint Utility Functions
 *
 * Demonstrates:
 * - Bit analysis: bitLength, leadingZeros, popCount
 * - Min/max operations
 * - Array operations
 * - Statistical functions
 */

import * as Uint from "../../../src/primitives/Uint/index.js";

const values = [
	Uint.ZERO,
	Uint.ONE,
	Uint.from(255n),
	Uint.from(256n),
	Uint.from(2n ** 100n),
	Uint.MAX,
];

for (const val of values) {
	const hex = val.toHex(false);
	const bitLen = val.bitLength();
	const leadingZeros = val.leadingZeros();
	const popCount = val.popCount();
}

function isPowerOfTwo(val: typeof Uint.prototype): boolean {
	// Power of 2 has exactly one bit set
	return !val.isZero() && val.popCount() === 1;
}

const testValues = [1n, 2n, 3n, 4n, 7n, 8n, 15n, 16n, 127n, 128n, 256n];

for (const num of testValues) {
	const val = Uint.from(num);
	const isPow2 = isPowerOfTwo(val);
}

const a = Uint.from(100n);
const b = Uint.from(200n);
const c = Uint.from(50n);

const numbers = [
	Uint.from(150n),
	Uint.from(42n),
	Uint.from(999n),
	Uint.from(7n),
	Uint.from(256n),
];

const min = numbers.reduce((acc, val) => acc.minimum(val));
const max = numbers.reduce((acc, val) => acc.maximum(val));

const unsorted = [
	Uint.from(42n),
	Uint.from(7n),
	Uint.from(256n),
	Uint.from(100n),
	Uint.from(1n),
];

const sorted = [...unsorted].sort((x, y) => {
	if (x.lessThan(y)) return -1;
	if (x.greaterThan(y)) return 1;
	return 0;
});

function clamp(
	val: typeof Uint.prototype,
	min: typeof Uint.prototype,
	max: typeof Uint.prototype,
): typeof Uint.prototype {
	return val.maximum(min).minimum(max);
}

const min_val = Uint.from(0n);
const max_val = Uint.from(100n);

const testClamp = [
	Uint.from(50n),
	Uint.from(150n),
	Uint.from(0n),
	Uint.from(200n),
];

for (const val of testClamp) {
	const clamped = clamp(val, min_val, max_val);
}

function hammingDistance(
	x: typeof Uint.prototype,
	y: typeof Uint.prototype,
): number {
	// Number of differing bits
	return x.bitwiseXor(y).popCount();
}

const val1 = Uint.from(0b1010n);
const val2 = Uint.from(0b1100n);
const val3 = Uint.from(0b0000n);

function getRequiredType(val: typeof Uint.prototype): string {
	const bits = val.bitLength();
	if (bits === 0) return "uint0";
	if (bits <= 8) return "uint8";
	if (bits <= 16) return "uint16";
	if (bits <= 32) return "uint32";
	if (bits <= 64) return "uint64";
	if (bits <= 128) return "uint128";
	return "uint256";
}

const widthTests = [
	Uint.from(100n),
	Uint.from(1000n),
	Uint.from(100000n),
	Uint.from(2n ** 32n),
	Uint.from(2n ** 64n),
	Uint.from(2n ** 200n),
];

for (const val of widthTests) {
	const type = getRequiredType(val);
	const bits = val.bitLength();
}

function findMedian(
	vals: (typeof Uint.prototype)[],
): typeof Uint.prototype | undefined {
	if (vals.length === 0) return undefined;

	const sorted_vals = [...vals].sort((x, y) => {
		if (x.lessThan(y)) return -1;
		if (x.greaterThan(y)) return 1;
		return 0;
	});

	const mid = Math.floor(sorted_vals.length / 2);

	if (sorted_vals.length % 2 === 1) {
		return sorted_vals[mid];
	}

	// Average of two middle values
	const sum = sorted_vals[mid - 1].plus(sorted_vals[mid]);
	return sum.dividedBy(Uint.from(2n));
}

const medianTest = [
	Uint.from(1n),
	Uint.from(5n),
	Uint.from(3n),
	Uint.from(9n),
	Uint.from(7n),
];
const median = findMedian(medianTest);

function bitDensity(val: typeof Uint.prototype): number {
	const total = val.bitLength();
	if (total === 0) return 0;
	const setCount = val.popCount();
	return setCount / total;
}

const densityTests = [
	Uint.from(0b1111n),
	Uint.from(0b1010n),
	Uint.from(0b10001n),
	Uint.from(0b11111111n),
];

for (const val of densityTests) {
	const density = bitDensity(val);
	const percentage = (density * 100).toFixed(1);
}

function isEvenParity(val: typeof Uint.prototype): boolean {
	return val.popCount() % 2 === 0;
}

function isOddParity(val: typeof Uint.prototype): boolean {
	return val.popCount() % 2 === 1;
}

const parityTests = [
	Uint.from(0b1100n),
	Uint.from(0b111n),
	Uint.from(0b10101010n),
];

for (const val of parityTests) {
	const even = isEvenParity(val);
	const odd = isOddParity(val);
}
