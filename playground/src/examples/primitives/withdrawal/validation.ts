import * as Withdrawal from "../../../primitives/Withdrawal/index.js";

// Example: Withdrawal validation and error handling

// Withdrawals must satisfy:
// - Non-negative indices
// - Valid 20-byte address
// - Non-negative amount
// - Amount in Gwei (not Wei)

console.log("Withdrawal Validation");
console.log("=====================\n");

// Valid withdrawal
try {
	const valid = Withdrawal.from({
		index: 1000000n,
		validatorIndex: 123456,
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 32000000000n,
	});
	console.log("Valid withdrawal:");
	console.log("  Index:", valid.index);
	console.log("  Validator:", valid.validatorIndex);
	console.log("  Status: OK");
} catch (error) {
	console.log("  Error:", (error as Error).message);
}

// Invalid withdrawal index (negative)
console.log("\nInvalid withdrawal index:");
try {
	Withdrawal.from({
		index: -1,
		validatorIndex: 123456,
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 32000000000n,
	});
	console.log("  Should have thrown");
} catch (error) {
	console.log("  Error:", (error as Error).message);
}

// Invalid validator index (negative)
console.log("\nInvalid validator index:");
try {
	Withdrawal.from({
		index: 1000000n,
		validatorIndex: -1,
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 32000000000n,
	});
	console.log("  Should have thrown");
} catch (error) {
	console.log("  Error:", (error as Error).message);
}

// Invalid address format
console.log("\nInvalid address:");
try {
	Withdrawal.from({
		index: 1000000n,
		validatorIndex: 123456,
		address: "0xinvalid",
		amount: 32000000000n,
	});
	console.log("  Should have thrown");
} catch (error) {
	console.log("  Error:", (error as Error).message);
}

// Address too short
console.log("\nAddress too short:");
try {
	Withdrawal.from({
		index: 1000000n,
		validatorIndex: 123456,
		address: "0x742d35Cc",
		amount: 32000000000n,
	});
	console.log("  Should have thrown");
} catch (error) {
	console.log("  Error:", (error as Error).message);
}

// Zero amount (valid but unusual)
console.log("\nZero amount withdrawal:");
try {
	const zero = Withdrawal.from({
		index: 1000000n,
		validatorIndex: 123456,
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 0n,
	});
	console.log("  Amount:", zero.amount, "Gwei");
	console.log("  Status: Valid (but unusual)");
} catch (error) {
	console.log("  Error:", (error as Error).message);
}

// Large amount (valid)
console.log("\nLarge withdrawal amount:");
try {
	const large = Withdrawal.from({
		index: 1000000n,
		validatorIndex: 123456,
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 100000000000n, // 100 ETH (unlikely but valid)
	});
	console.log("  Amount:", large.amount, "Gwei");
	console.log("  ETH:", Number(large.amount) / 1_000_000_000);
	console.log("  Status: Valid");
} catch (error) {
	console.log("  Error:", (error as Error).message);
}

// Common mistake: using Wei instead of Gwei
console.log("\nCommon mistake - Wei vs Gwei:");
const correctGwei = Withdrawal.from({
	index: 1000000n,
	validatorIndex: 123456,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 32000000000n, // 32 ETH in Gwei
});
console.log("  Correct (Gwei):", correctGwei.amount);
console.log("  In ETH:", Number(correctGwei.amount) / 1_000_000_000);

const wrongWei = Withdrawal.from({
	index: 1000000n,
	validatorIndex: 123456,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 32000000000000000000n, // Would be Wei
});
console.log("  Wrong (Wei as Gwei):", wrongWei.amount);
console.log(
	"  Would represent:",
	Number(wrongWei.amount) / 1_000_000_000,
	"ETH",
);

// Validation checklist
console.log("\nValidation checklist:");
console.log("  ✓ Index >= 0");
console.log("  ✓ ValidatorIndex >= 0");
console.log("  ✓ Address is 20 bytes");
console.log("  ✓ Amount >= 0");
console.log("  ✓ Amount in Gwei (not Wei)");
console.log("  ✓ Indices monotonically increase");
