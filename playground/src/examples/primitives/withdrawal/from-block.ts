import * as Withdrawal from "../../../primitives/Withdrawal/index.js";

// Example: Reading withdrawals from blocks

// Withdrawals appear in execution layer blocks starting Shanghai
// Each block can contain 0-16 withdrawals
// They're processed automatically without transactions

console.log("Reading Withdrawals from Blocks");
console.log("================================\n");

// First Shanghai block with withdrawals (17,034,870)
const shanghaiFirst = [
	Withdrawal.from({
		index: 0n,
		validatorIndex: 0,
		address: "0x8bBe03F3e48391a3aC1Ee5e09e23e5b8F5E4c078",
		amount: 1n,
	}),
];

console.log("First Shanghai block (17,034,870):");
console.log("  Date: April 12, 2023");
console.log("  Withdrawals:", shanghaiFirst.length);
console.log("  First index:", shanghaiFirst[0].index);
console.log("  Historic: First ever withdrawal");

// Typical block with multiple withdrawals
const typicalBlock = [
	Withdrawal.from({
		index: 1000000n,
		validatorIndex: 123456,
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 32000000000n,
	}),
	Withdrawal.from({
		index: 1000001n,
		validatorIndex: 123480,
		address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
		amount: 50000000n,
	}),
	Withdrawal.from({
		index: 1000002n,
		validatorIndex: 123505,
		address: "0x5aAed5930B9EB3cd462dDbaEfA21Da757F30FbDd",
		amount: 45000000n,
	}),
	Withdrawal.from({
		index: 1000003n,
		validatorIndex: 123530,
		address: "0x8bBe03F3e48391a3aC1Ee5e09e23e5b8F5E4c078",
		amount: 32750000000n,
	}),
];

console.log("\nTypical block withdrawals:");
console.log("  Count:", typicalBlock.length);
console.log(
	"  First:",
	typicalBlock[0].index,
	"→",
	typicalBlock[0].validatorIndex,
);
console.log(
	"  Last:",
	typicalBlock[3].index,
	"→",
	typicalBlock[3].validatorIndex,
);

const totalEth =
	typicalBlock.reduce((sum, w) => sum + Number(w.amount), 0) / 1_000_000_000;
console.log("  Total:", totalEth.toFixed(2), "ETH");

// Full block (16 withdrawals)
const maxBlock = Array.from({ length: 16 }, (_, i) =>
	Withdrawal.from({
		index: 2000000n + BigInt(i),
		validatorIndex: 200000 + i,
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 50000000n,
	}),
);

console.log("\nFull block (max capacity):");
console.log("  Withdrawals:", maxBlock.length);
console.log(
	"  Validator range:",
	maxBlock[0].validatorIndex,
	"→",
	maxBlock[15].validatorIndex,
);
console.log("  All partial: Yes");

// Empty block (no withdrawals)
const emptyBlock: typeof typicalBlock = [];

console.log("\nEmpty block:");
console.log("  Withdrawals:", emptyBlock.length);
console.log("  Reason: No validators ready");
console.log("  Common: Early in sweep cycle");

// Block with high-value withdrawals
const highValueBlock = [
	Withdrawal.from({
		index: 3000000n,
		validatorIndex: 400000,
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 32000000000n, // 32 ETH
	}),
	Withdrawal.from({
		index: 3000001n,
		validatorIndex: 400010,
		address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
		amount: 32500000000n, // 32.5 ETH
	}),
	Withdrawal.from({
		index: 3000002n,
		validatorIndex: 400020,
		address: "0x5aAed5930B9EB3cd462dDbaEfA21Da757F30FbDd",
		amount: 33000000000n, // 33 ETH
	}),
];

console.log("\nHigh-value block:");
console.log("  Withdrawals:", highValueBlock.length);
const highTotal =
	highValueBlock.reduce((sum, w) => sum + Number(w.amount), 0) / 1_000_000_000;
console.log("  Total:", highTotal.toFixed(2), "ETH");
console.log(
	"  Average:",
	(highTotal / highValueBlock.length).toFixed(2),
	"ETH",
);
console.log("  Type: Full withdrawals (exits)");

// Parsing block data
console.log("\nParsing block withdrawal data:");
console.log("  1. Fetch block by number/hash");
console.log("  2. Access 'withdrawals' field");
console.log("  3. Each withdrawal has 4 fields");
console.log("  4. Index is monotonically increasing");
console.log("  5. ValidatorIndex may jump (sparse)");
console.log("  6. Amount in Gwei (not Wei)");

// Track withdrawal statistics
const allWithdrawals = [
	...shanghaiFirst,
	...typicalBlock,
	...maxBlock,
	...highValueBlock,
];
const totalWithdrawals = allWithdrawals.length;
const totalGwei = allWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
const totalEthAll = totalGwei / 1_000_000_000;
const avgGwei = totalGwei / totalWithdrawals;

console.log("\nAggregate statistics:");
console.log("  Total withdrawals:", totalWithdrawals);
console.log("  Total amount:", totalEthAll.toFixed(2), "ETH");
console.log("  Average:", avgGwei.toFixed(0), "Gwei");
console.log("  Min index:", allWithdrawals[0].index);
console.log("  Max index:", allWithdrawals[allWithdrawals.length - 1].index);
