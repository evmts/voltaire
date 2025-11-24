import * as StorageValue from "../../../primitives/StorageValue/index.js";

// Example: Boolean values in storage

// In EVM, booleans are stored as uint256 where 0 = false, 1 = true

// False value (0)
const falseVal = StorageValue.from(0n);
console.log("False:", StorageValue.toHex(falseVal));
console.log("As uint256:", StorageValue.toUint256(falseVal));
console.log("Is false:", StorageValue.toUint256(falseVal) === 0n);

// True value (1)
const trueVal = StorageValue.from(1n);
console.log("\nTrue:", StorageValue.toHex(trueVal));
console.log("As uint256:", StorageValue.toUint256(trueVal));
console.log("Is true:", StorageValue.toUint256(trueVal) === 1n);

// Helper function to check boolean value
const isTruthy = (storage: StorageValue.StorageValueType): boolean => {
	return StorageValue.toUint256(storage) !== 0n;
};

console.log("\nTruthiness checks:");
console.log("falseVal is truthy:", isTruthy(falseVal));
console.log("trueVal is truthy:", isTruthy(trueVal));

// Note: Solidity may store any non-zero value as "true"
const weirdTrue = StorageValue.from(42n);
console.log("\nNon-standard true (42):", StorageValue.toHex(weirdTrue));
console.log("Is truthy:", isTruthy(weirdTrue));

// Common boolean storage patterns

// Contract paused flag
const isPaused = StorageValue.from(0n); // Not paused
console.log("\nContract paused:", isTruthy(isPaused));

// Feature enabled flag
const isEnabled = StorageValue.from(1n); // Enabled
console.log("Feature enabled:", isTruthy(isEnabled));

// Initialization flag
const isInitialized = StorageValue.from(1n);
console.log("Initialized:", isTruthy(isInitialized));

// Multiple boolean checks
const flag1 = StorageValue.from(1n);
const flag2 = StorageValue.from(0n);
const flag3 = StorageValue.from(1n);

console.log("\nMultiple flags:");
console.log("Flag 1:", isTruthy(flag1));
console.log("Flag 2:", isTruthy(flag2));
console.log("Flag 3:", isTruthy(flag3));
console.log(
	"All flags true:",
	isTruthy(flag1) && isTruthy(flag2) && isTruthy(flag3),
);
console.log(
	"Any flag true:",
	isTruthy(flag1) || isTruthy(flag2) || isTruthy(flag3),
);

// Boolean comparison
console.log("\nBoolean comparison:");
console.log(
	"true equals true:",
	StorageValue.equals(StorageValue.from(1n), StorageValue.from(1n)),
);
console.log(
	"false equals false:",
	StorageValue.equals(StorageValue.from(0n), StorageValue.from(0n)),
);
console.log(
	"true equals false:",
	StorageValue.equals(StorageValue.from(1n), StorageValue.from(0n)),
);
