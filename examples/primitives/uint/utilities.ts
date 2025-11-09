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

console.log("\n=== Uint Utility Functions Example ===\n");

// 1. Bit analysis
console.log("1. Bit Analysis");
console.log("   -----------");

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

	console.log(`   Value: ${hex}`);
	console.log(`   - Bit length: ${bitLen} bits`);
	console.log(`   - Leading zeros: ${leadingZeros} bits`);
	console.log(`   - Population count: ${popCount} set bits\n`);
}

// 2. Power of 2 detection
console.log("2. Power of 2 Detection");
console.log("   -------------------");

function isPowerOfTwo(val: typeof Uint.prototype): boolean {
	// Power of 2 has exactly one bit set
	return !val.isZero() && val.popCount() === 1;
}

const testValues = [1n, 2n, 3n, 4n, 7n, 8n, 15n, 16n, 127n, 128n, 256n];

for (const num of testValues) {
	const val = Uint.from(num);
	const isPow2 = isPowerOfTwo(val);
	console.log(`   ${num} is power of 2? ${isPow2}`);
}
console.log();

// 3. Min/max operations
console.log("3. Min/Max Operations");
console.log("   -----------------");

const a = Uint.from(100n);
const b = Uint.from(200n);
const c = Uint.from(50n);

console.log(
	`   a = ${a.toString()}, b = ${b.toString()}, c = ${c.toString()}\n`,
);
console.log(`   min(a, b) = ${a.minimum(b).toString()}`);
console.log(`   max(a, b) = ${a.maximum(b).toString()}`);
console.log(`   min(a, c) = ${a.minimum(c).toString()}`);
console.log(`   max(a, c) = ${a.maximum(c).toString()}\n`);

// 4. Finding min/max in array
console.log("4. Array Min/Max");
console.log("   ------------");

const numbers = [
	Uint.from(150n),
	Uint.from(42n),
	Uint.from(999n),
	Uint.from(7n),
	Uint.from(256n),
];

console.log(`   Array: [${numbers.map((n) => n.toString()).join(", ")}]\n`);

const min = numbers.reduce((acc, val) => acc.minimum(val));
const max = numbers.reduce((acc, val) => acc.maximum(val));

console.log(`   Minimum: ${min.toString()}`);
console.log(`   Maximum: ${max.toString()}\n`);

// 5. Sorting
console.log("5. Sorting Array");
console.log("   ------------");

const unsorted = [
	Uint.from(42n),
	Uint.from(7n),
	Uint.from(256n),
	Uint.from(100n),
	Uint.from(1n),
];

console.log(`   Unsorted: [${unsorted.map((n) => n.toString()).join(", ")}]`);

const sorted = [...unsorted].sort((x, y) => {
	if (x.lessThan(y)) return -1;
	if (x.greaterThan(y)) return 1;
	return 0;
});

console.log(`   Sorted:   [${sorted.map((n) => n.toString()).join(", ")}]\n`);

// 6. Clamping values
console.log("6. Clamping Values");
console.log("   --------------");

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

console.log(`   Range: [${min_val.toString()}, ${max_val.toString()}]\n`);

for (const val of testClamp) {
	const clamped = clamp(val, min_val, max_val);
	console.log(`   clamp(${val.toString()}) = ${clamped.toString()}`);
}
console.log();

// 7. Hamming distance
console.log("7. Hamming Distance");
console.log("   ---------------");

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

console.log(`   ${val1.toString()} (0b${val1.toString(2)})`);
console.log(`   ${val2.toString()} (0b${val2.toString(2)})`);
console.log(`   Hamming distance: ${hammingDistance(val1, val2)} bits\n`);

console.log(`   ${val1.toString()} (0b${val1.toString(2)})`);
console.log(`   ${val3.toString()} (0b${val3.toString(2)})`);
console.log(`   Hamming distance: ${hammingDistance(val1, val3)} bits\n`);

// 8. Bit width requirements
console.log("8. Bit Width Requirements");
console.log("   ---------------------");

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
	console.log(
		`   ${val.toString().slice(0, 30)}... requires ${type} (${bits} bits)`,
	);
}
console.log();

// 9. Finding median
console.log("9. Finding Median");
console.log("   -------------");

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

console.log(`   Values: [${medianTest.map((n) => n.toString()).join(", ")}]`);
const median = findMedian(medianTest);
console.log(`   Median: ${median ? median.toString() : "undefined"}\n`);

// 10. Bit density analysis
console.log("10. Bit Density Analysis");
console.log("    -------------------");

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
	console.log(
		`   0b${val.toString(2)}: ${percentage}% bits set (${val.popCount()}/${val.bitLength()})`,
	);
}
console.log();

// 11. Parity check
console.log("11. Parity Check");
console.log("    -----------");

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
	console.log(
		`   0b${val.toString(2)}: ${val.popCount()} bits set, even parity? ${even}, odd parity? ${odd}`,
	);
}
console.log();

console.log("=== Example Complete ===\n");
