import { StorageValue } from "voltaire";

// Example: Comparing storage values

// Create test values
const val1 = StorageValue.from(100n);
const val2 = StorageValue.from(100n);
const val3 = StorageValue.from(200n);

// Zero value comparisons
const zero1 = StorageValue.from(0n);
const zero2 = StorageValue.from(0n);
const nonZero = StorageValue.from(1n);

// Maximum value comparison
const max1 = StorageValue.from(2n ** 256n - 1n);
const max2 = StorageValue.from(2n ** 256n - 1n);
const almostMax = StorageValue.from(2n ** 256n - 2n);

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

// Sorting storage values
const sorted = [...values].sort((a, b) => compare(a, b));
sorted.forEach((v, i) => {});

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

// Comparing hex representations
const hexCompare = (
	a: StorageValue.StorageValueType,
	b: StorageValue.StorageValueType,
): boolean => {
	return StorageValue.toHex(a) === StorageValue.toHex(b);
};
