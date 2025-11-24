import * as Withdrawal from "../../../primitives/Withdrawal/index.js";

// Example: Withdrawal queue and processing

// Withdrawals are processed in a queue with these characteristics:
// - FIFO (first in, first out) based on validator index
// - 16 withdrawals maximum per block
// - Automatic processing by protocol
// - Round-robin sweep of all validators

console.log("Withdrawal Queue Processing");
console.log("============================\n");

// Sequential withdrawals in a single block
const block1 = [
	Withdrawal.from({
		index: 20000000n,
		validatorIndex: 100000,
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 32000000000n, // Full withdrawal
	}),
	Withdrawal.from({
		index: 20000001n,
		validatorIndex: 100025,
		address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
		amount: 50000000n, // Partial withdrawal
	}),
	Withdrawal.from({
		index: 20000002n,
		validatorIndex: 100050,
		address: "0x5aAed5930B9EB3cd462dDbaEfA21Da757F30FbDd",
		amount: 32500000000n, // Full withdrawal with rewards
	}),
];

console.log("Block withdrawals (sequential):");
block1.forEach((w, i) => {
	console.log(`  [${i}] Index: ${w.index}, Validator: ${w.validatorIndex}`);
	console.log(`      Amount: ${w.amount} Gwei`);
});

// Full block (16 withdrawals max)
const fullBlock = Array.from({ length: 16 }, (_, i) =>
	Withdrawal.from({
		index: 20100000n + BigInt(i),
		validatorIndex: 200000 + i * 25, // Spaced validators
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 50000000n, // All partial withdrawals
	}),
);

console.log("\nFull block (16 withdrawals):");
console.log("  Count:", fullBlock.length);
console.log("  First validator:", fullBlock[0].validatorIndex);
console.log("  Last validator:", fullBlock[15].validatorIndex);
console.log(
	"  Total amount:",
	(Number(fullBlock[0].amount) * 16) / 1_000_000_000,
	"ETH",
);

// Validator sweep cycle
const totalValidators = 500000;
const withdrawalsPerBlock = 16;
const blocksPerDay = 7200; // 12 seconds per block
const withdrawalsPerDay = withdrawalsPerBlock * blocksPerDay;
const cycleDays = totalValidators / withdrawalsPerDay;

console.log("\nValidator sweep cycle:");
console.log("  Total validators:", totalValidators.toLocaleString());
console.log("  Withdrawals/block:", withdrawalsPerBlock);
console.log("  Blocks/day:", blocksPerDay.toLocaleString());
console.log("  Withdrawals/day:", withdrawalsPerDay.toLocaleString());
console.log("  Full cycle:", cycleDays.toFixed(1), "days");

// Queue priorities
console.log("\nWithdrawal priorities:");
console.log("  1. Validator order (index ascending)");
console.log("  2. Full vs partial: No difference");
console.log("  3. Amount: No difference");
console.log("  4. Time in queue: No difference");
console.log("  Rule: Pure round-robin by validator index");

// Estimating your withdrawal
const yourValidatorIndex = 123456;
const currentSweepIndex = 100000;
const indexDifference =
	yourValidatorIndex > currentSweepIndex
		? yourValidatorIndex - currentSweepIndex
		: totalValidators - currentSweepIndex + yourValidatorIndex;
const daysUntilWithdrawal = indexDifference / withdrawalsPerDay;

console.log("\nEstimate your withdrawal:");
console.log("  Your validator:", yourValidatorIndex);
console.log("  Current sweep:", currentSweepIndex);
console.log("  Validators ahead:", indexDifference.toLocaleString());
console.log("  Days until withdrawal:", daysUntilWithdrawal.toFixed(2));
console.log(
	"  Approximate date:",
	new Date(Date.now() + daysUntilWithdrawal * 86400000).toDateString(),
);

// Block with mix of full and partial
const mixedBlock = [
	Withdrawal.from({
		index: 20200000n,
		validatorIndex: 300000,
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 32000000000n, // Full
	}),
	Withdrawal.from({
		index: 20200001n,
		validatorIndex: 300025,
		address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
		amount: 45000000n, // Partial
	}),
	Withdrawal.from({
		index: 20200002n,
		validatorIndex: 300050,
		address: "0x5aAed5930B9EB3cd462dDbaEfA21Da757F30FbDd",
		amount: 50000000n, // Partial
	}),
];

const totalAmount = mixedBlock.reduce((sum, w) => sum + Number(w.amount), 0);
console.log("\nMixed withdrawal block:");
console.log("  Withdrawals:", mixedBlock.length);
console.log(
	"  Full:",
	mixedBlock.filter((w) => w.amount >= 32000000000n).length,
);
console.log(
	"  Partial:",
	mixedBlock.filter((w) => w.amount < 32000000000n).length,
);
console.log("  Total:", (totalAmount / 1_000_000_000).toFixed(2), "ETH");
