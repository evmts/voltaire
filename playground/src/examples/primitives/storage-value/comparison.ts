import * as StorageValue from "../../../primitives/StorageValue/index.js";

// Example: Comparing storage values

// Create test values
const val1 = StorageValue.from(100n);
const val2 = StorageValue.from(100n);
const val3 = StorageValue.from(200n);

console.log("Value 1:", StorageValue.toHex(val1));
console.log("Value 2:", StorageValue.toHex(val2));
console.log("Value 3:", StorageValue.toHex(val3));

// Equality comparison (constant-time)
console.log("\nEquality comparisons:");
console.log("val1 equals val2:", StorageValue.equals(val1, val2));
console.log("val1 equals val3:", StorageValue.equals(val1, val3));
console.log("val2 equals val3:", StorageValue.equals(val2, val3));

// Zero value comparisons
const zero1 = StorageValue.from(0n);
const zero2 = StorageValue.from(0n);
const nonZero = StorageValue.from(1n);

console.log("\nZero comparisons:");
console.log("zero1 equals zero2:", StorageValue.equals(zero1, zero2));
console.log("zero1 equals nonZero:", StorageValue.equals(zero1, nonZero));

// Maximum value comparison
const max1 = StorageValue.from(2n ** 256n - 1n);
const max2 = StorageValue.from(2n ** 256n - 1n);
const almostMax = StorageValue.from(2n ** 256n - 2n);

console.log("\nMax value comparisons:");
console.log("max1 equals max2:", StorageValue.equals(max1, max2));
console.log("max1 equals almostMax:", StorageValue.equals(max1, almostMax));

// Numeric comparisons (convert to bigint)
const compare = (
	a: StorageValue.StorageValueType,
	b: StorageValue.StorageValueType,
): number => {
	const aNum = StorageValue.toUint256(a);
	const bNum = StorageValue.toUint256(b);
	if (aNum < bNum) return -1;
	if (aNum > bNum) return 1;
	return 0;
};

console.log("\nNumeric comparisons:");
console.log("compare(val1, val2):", compare(val1, val2)); // 0
console.log("compare(val1, val3):", compare(val1, val3)); // -1
console.log("compare(val3, val1):", compare(val3, val1)); // 1

// Less than / Greater than
const lessThan = (
	a: StorageValue.StorageValueType,
	b: StorageValue.StorageValueType,
): boolean => {
	return StorageValue.toUint256(a) < StorageValue.toUint256(b);
};

const greaterThan = (
	a: StorageValue.StorageValueType,
	b: StorageValue.StorageValueType,
): boolean => {
	return StorageValue.toUint256(a) > StorageValue.toUint256(b);
};

console.log("\nRelational comparisons:");
console.log("val1 < val3:", lessThan(val1, val3));
console.log("val3 > val1:", greaterThan(val3, val1));
console.log("val1 < val2:", lessThan(val1, val2));

// Range checks
const value = StorageValue.from(150n);
const min = StorageValue.from(100n);
const max = StorageValue.from(200n);

const inRange = (
	val: StorageValue.StorageValueType,
	minVal: StorageValue.StorageValueType,
	maxVal: StorageValue.StorageValueType,
): boolean => {
	const v = StorageValue.toUint256(val);
	const minV = StorageValue.toUint256(minVal);
	const maxV = StorageValue.toUint256(maxVal);
	return v >= minV && v <= maxV;
};

console.log("\nRange check:");
console.log("Value:", StorageValue.toUint256(value));
console.log("Min:", StorageValue.toUint256(min));
console.log("Max:", StorageValue.toUint256(max));
console.log("In range:", inRange(value, min, max));

// Array of storage values - find min/max
const values = [
	StorageValue.from(100n),
	StorageValue.from(500n),
	StorageValue.from(50n),
	StorageValue.from(1000n),
	StorageValue.from(250n),
];

const findMin = (
	vals: StorageValue.StorageValueType[],
): StorageValue.StorageValueType => {
	return vals.reduce((min, current) =>
		lessThan(current, min) ? current : min,
	);
};

const findMax = (
	vals: StorageValue.StorageValueType[],
): StorageValue.StorageValueType => {
	return vals.reduce((max, current) =>
		greaterThan(current, max) ? current : max,
	);
};

console.log("\nArray operations:");
console.log(
	"Values:",
	values.map((v) => StorageValue.toUint256(v)),
);
console.log("Min:", StorageValue.toUint256(findMin(values)));
console.log("Max:", StorageValue.toUint256(findMax(values)));

// Sorting storage values
const sorted = [...values].sort((a, b) => compare(a, b));

console.log("\nSorted values:");
sorted.forEach((v, i) => {
	console.log(`  ${i}: ${StorageValue.toUint256(v)}`);
});

// Checking for duplicates
const hasDuplicates = (vals: StorageValue.StorageValueType[]): boolean => {
	for (let i = 0; i < vals.length; i++) {
		for (let j = i + 1; j < vals.length; j++) {
			if (StorageValue.equals(vals[i], vals[j])) {
				return true;
			}
		}
	}
	return false;
};

const uniqueValues = [
	StorageValue.from(1n),
	StorageValue.from(2n),
	StorageValue.from(3n),
];
const duplicateValues = [
	StorageValue.from(1n),
	StorageValue.from(2n),
	StorageValue.from(1n),
];

console.log("\nDuplicate checking:");
console.log("Unique values have duplicates:", hasDuplicates(uniqueValues));
console.log(
	"Duplicate values have duplicates:",
	hasDuplicates(duplicateValues),
);

// Comparing hex representations
const hexCompare = (
	a: StorageValue.StorageValueType,
	b: StorageValue.StorageValueType,
): boolean => {
	return StorageValue.toHex(a) === StorageValue.toHex(b);
};

console.log("\nHex comparison:");
console.log("val1 hex equals val2:", hexCompare(val1, val2));
console.log("val1 hex equals val3:", hexCompare(val1, val3));
