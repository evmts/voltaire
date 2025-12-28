import { StorageValue } from "voltaire";

// Example: Validating storage values

// Check if value is zero
const isZero = (storage: StorageValue.StorageValueType): boolean => {
	return storage.every((byte) => byte === 0);
};

const zero = StorageValue.from(0n);
const nonZero = StorageValue.from(123n);

// Check if value is maximum
const isMaxUint256 = (storage: StorageValue.StorageValueType): boolean => {
	return storage.every((byte) => byte === 0xff);
};

const max = StorageValue.from(2n ** 256n - 1n);
const notMax = StorageValue.from(2n ** 256n - 2n);

// Validate value is within range
const validateRange = (
	storage: StorageValue.StorageValueType,
	min: bigint,
	max: bigint,
): boolean => {
	const value = StorageValue.toUint256(storage);
	return value >= min && value <= max;
};

const value1 = StorageValue.from(500n);

// Validate as boolean (must be 0 or 1)
const isValidBool = (storage: StorageValue.StorageValueType): boolean => {
	const value = StorageValue.toUint256(storage);
	return value === 0n || value === 1n;
};

const validBool = StorageValue.from(1n);
const invalidBool = StorageValue.from(42n);

// Validate as address (first 12 bytes must be zero)
const isValidAddress = (storage: StorageValue.StorageValueType): boolean => {
	// Check first 12 bytes are zero
	for (let i = 0; i < 12; i++) {
		if (storage[i] !== 0) return false;
	}
	return true;
};

const validAddr = StorageValue.from(
	"0x000000000000000000000000742d35Cc6634C0532925a3b844Bc454e4438f44e",
);
const invalidAddr = StorageValue.from(
	"0x0000000000000001000000742d35cc6634c0532925a3b844bc454e4438f44e00",
);

// Validate non-zero (initialized storage)
const isInitialized = (storage: StorageValue.StorageValueType): boolean => {
	return !isZero(storage);
};

// Validate multiple of a value
const isMultipleOf = (
	storage: StorageValue.StorageValueType,
	divisor: bigint,
): boolean => {
	const value = StorageValue.toUint256(storage);
	return value % divisor === 0n;
};

const val1000 = StorageValue.from(1000n);
const val1001 = StorageValue.from(1001n);

// Validate power of 2
const isPowerOfTwo = (storage: StorageValue.StorageValueType): boolean => {
	const value = StorageValue.toUint256(storage);
	if (value === 0n) return false;
	return (value & (value - 1n)) === 0n;
};

const pow2 = StorageValue.from(256n);
const notPow2 = StorageValue.from(100n);

// Validate timestamp (reasonable Unix timestamp)
const isValidTimestamp = (storage: StorageValue.StorageValueType): boolean => {
	const value = StorageValue.toUint256(storage);
	// Between Jan 1, 2000 and Jan 1, 2100
	const minTimestamp = 946684800n; // Jan 1, 2000
	const maxTimestamp = 4102444800n; // Jan 1, 2100
	return value >= minTimestamp && value <= maxTimestamp;
};

const validTime = StorageValue.from(1700000000n); // Nov 2023
const invalidTime = StorageValue.from(100n); // Too early

// Validate ERC20 decimals (0-18)
const isValidDecimals = (storage: StorageValue.StorageValueType): boolean => {
	const value = StorageValue.toUint256(storage);
	return value >= 0n && value <= 18n;
};

const validDecimals = StorageValue.from(18n);
const invalidDecimals = StorageValue.from(100n);

// Validate basis points (0-10000, where 10000 = 100%)
const isValidBasisPoints = (
	storage: StorageValue.StorageValueType,
): boolean => {
	const value = StorageValue.toUint256(storage);
	return value >= 0n && value <= 10000n;
};

const validBps = StorageValue.from(2500n); // 25%
const invalidBps = StorageValue.from(20000n); // 200% - invalid

// Validate even number
const isEven = (storage: StorageValue.StorageValueType): boolean => {
	const value = StorageValue.toUint256(storage);
	return (value & 1n) === 0n;
};

const even = StorageValue.from(100n);
const odd = StorageValue.from(101n);

// Validate has specific bit set
const hasBitSet = (
	storage: StorageValue.StorageValueType,
	bitIndex: number,
): boolean => {
	const value = StorageValue.toUint256(storage);
	return (value & (1n << BigInt(bitIndex))) !== 0n;
};

const flags = StorageValue.from(0b1010n); // Bits 1 and 3 set

// Batch validation
const validate = (
	storage: StorageValue.StorageValueType,
	...validators: Array<(s: StorageValue.StorageValueType) => boolean>
): boolean => {
	return validators.every((validator) => validator(storage));
};

const testValue = StorageValue.from(100n);
