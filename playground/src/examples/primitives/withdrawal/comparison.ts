import * as Withdrawal from "../../../primitives/Withdrawal/index.js";

// Example: Comparing and analyzing withdrawals

// Use equals() to compare withdrawals
// All four fields must match for equality

console.log("Withdrawal Comparison");
console.log("=====================\n");

// Identical withdrawals
const withdrawal1 = Withdrawal.from({
	index: 1000000n,
	validatorIndex: 123456,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 32000000000n,
});

const withdrawal2 = Withdrawal.from({
	index: 1000000n,
	validatorIndex: 123456,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 32000000000n,
});

console.log("Identical withdrawals:");
console.log(
	"  withdrawal1 == withdrawal2:",
	Withdrawal.equals(withdrawal1, withdrawal2),
);
console.log("  All fields match: Yes");

// Different index
const differentIndex = Withdrawal.from({
	index: 1000001n, // Different
	validatorIndex: 123456,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 32000000000n,
});

console.log("\nDifferent index:");
console.log(
	"  withdrawal1 == differentIndex:",
	Withdrawal.equals(withdrawal1, differentIndex),
);
console.log("  Index1:", withdrawal1.index);
console.log("  Index2:", differentIndex.index);

// Different validator
const differentValidator = Withdrawal.from({
	index: 1000000n,
	validatorIndex: 123457, // Different
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 32000000000n,
});

console.log("\nDifferent validator:");
console.log(
	"  withdrawal1 == differentValidator:",
	Withdrawal.equals(withdrawal1, differentValidator),
);
console.log("  Validator1:", withdrawal1.validatorIndex);
console.log("  Validator2:", differentValidator.validatorIndex);

// Different address
const differentAddress = Withdrawal.from({
	index: 1000000n,
	validatorIndex: 123456,
	address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045", // Different
	amount: 32000000000n,
});

console.log("\nDifferent address:");
console.log(
	"  withdrawal1 == differentAddress:",
	Withdrawal.equals(withdrawal1, differentAddress),
);
console.log("  Address differs: Yes");

// Different amount
const differentAmount = Withdrawal.from({
	index: 1000000n,
	validatorIndex: 123456,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 32000000001n, // Different
});

console.log("\nDifferent amount:");
console.log(
	"  withdrawal1 == differentAmount:",
	Withdrawal.equals(withdrawal1, differentAmount),
);
console.log("  Amount1:", withdrawal1.amount, "Gwei");
console.log("  Amount2:", differentAmount.amount, "Gwei");

// Sorting withdrawals by index
const unsorted = [
	Withdrawal.from({
		index: 3n,
		validatorIndex: 300,
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 32000000000n,
	}),
	Withdrawal.from({
		index: 1n,
		validatorIndex: 100,
		address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
		amount: 32000000000n,
	}),
	Withdrawal.from({
		index: 2n,
		validatorIndex: 200,
		address: "0x5aAed5930B9EB3cd462dDbaEfA21Da757F30FbDd",
		amount: 32000000000n,
	}),
];

const sorted = [...unsorted].sort((a, b) => Number(a.index - b.index));

console.log("\nSorting by index:");
console.log("  Unsorted:", unsorted.map((w) => w.index).join(", "));
console.log("  Sorted:", sorted.map((w) => w.index).join(", "));

// Finding specific withdrawal
const withdrawals = [withdrawal1, differentIndex, differentValidator];
const targetIndex = 1000001n;
const found = withdrawals.find((w) => w.index === targetIndex);

console.log("\nFinding withdrawal by index:");
console.log("  Target:", targetIndex);
console.log("  Found:", found ? "Yes" : "No");
if (found) {
	console.log("  Validator:", found.validatorIndex);
}

// Grouping by validator
const multipleWithdrawals = [
	Withdrawal.from({
		index: 1n,
		validatorIndex: 100,
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 50000000n,
	}),
	Withdrawal.from({
		index: 2n,
		validatorIndex: 100,
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 45000000n,
	}),
	Withdrawal.from({
		index: 3n,
		validatorIndex: 200,
		address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
		amount: 32000000000n,
	}),
];

const grouped = multipleWithdrawals.reduce(
	(acc, w) => {
		const key = w.validatorIndex;
		if (!acc[key]) acc[key] = [];
		acc[key].push(w);
		return acc;
	},
	{} as Record<number, typeof multipleWithdrawals>,
);

console.log("\nGrouping by validator:");
Object.entries(grouped).forEach(([validator, wds]) => {
	const total = wds.reduce((sum, w) => sum + Number(w.amount), 0);
	console.log(`  Validator ${validator}:`);
	console.log(`    Withdrawals: ${wds.length}`);
	console.log(`    Total: ${(total / 1_000_000_000).toFixed(3)} ETH`);
});

// Filtering by amount threshold
const threshold = 1000000000n; // 1 ETH
const large = multipleWithdrawals.filter((w) => w.amount >= threshold);
const small = multipleWithdrawals.filter((w) => w.amount < threshold);

console.log("\nFiltering by amount:");
console.log("  Threshold: 1 ETH");
console.log("  Large (>= 1 ETH):", large.length);
console.log("  Small (< 1 ETH):", small.length);
