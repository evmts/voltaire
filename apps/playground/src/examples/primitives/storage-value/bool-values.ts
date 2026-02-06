import { StorageValue } from "@tevm/voltaire";

// Example: Boolean values in storage

// In EVM, booleans are stored as uint256 where 0 = false, 1 = true

// False value (0)
const falseVal = StorageValue(0n);

// True value (1)
const trueVal = StorageValue(1n);

// Helper function to check boolean value
const isTruthy = (storage: StorageValue.StorageValueType): boolean => {
	return StorageValue.toUint256(storage) !== 0n;
};

// Note: Solidity may store any non-zero value as "true"
const weirdTrue = StorageValue(42n);

// Common boolean storage patterns

// Contract paused flag
const isPaused = StorageValue(0n); // Not paused

// Feature enabled flag
const isEnabled = StorageValue(1n); // Enabled

// Initialization flag
const isInitialized = StorageValue(1n);

// Multiple boolean checks
const flag1 = StorageValue(1n);
const flag2 = StorageValue(0n);
const flag3 = StorageValue(1n);
