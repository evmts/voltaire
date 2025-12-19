import * as StorageValue from "../../../primitives/StorageValue/index.js";

// Example: Boolean values in storage

// In EVM, booleans are stored as uint256 where 0 = false, 1 = true

// False value (0)
const falseVal = StorageValue.from(0n);

// True value (1)
const trueVal = StorageValue.from(1n);

// Helper function to check boolean value
const isTruthy = (storage: StorageValue.StorageValueType): boolean => {
	return StorageValue.toUint256(storage) !== 0n;
};

// Note: Solidity may store any non-zero value as "true"
const weirdTrue = StorageValue.from(42n);

// Common boolean storage patterns

// Contract paused flag
const isPaused = StorageValue.from(0n); // Not paused

// Feature enabled flag
const isEnabled = StorageValue.from(1n); // Enabled

// Initialization flag
const isInitialized = StorageValue.from(1n);

// Multiple boolean checks
const flag1 = StorageValue.from(1n);
const flag2 = StorageValue.from(0n);
const flag3 = StorageValue.from(1n);
