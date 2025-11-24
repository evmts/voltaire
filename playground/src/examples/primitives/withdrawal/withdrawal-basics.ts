import * as Withdrawal from "../../../primitives/Withdrawal/index.js";

// Example: Withdrawal basics (EIP-4895 Shanghai upgrade)

// EIP-4895 introduced withdrawals in the Shanghai upgrade (April 2023)
// Withdrawals enable ETH transfer from beacon chain validators to execution layer

// Withdrawal structure has 4 fields:
// - index: Global withdrawal counter (monotonically increasing)
// - validatorIndex: Validator's index on beacon chain
// - address: Execution layer address receiving funds
// - amount: Amount in Gwei (1 ETH = 1,000,000,000 Gwei)

// Create a full withdrawal (validator exit, 32 ETH)
const fullWithdrawal = Withdrawal.from({
	index: 1000000n,
	validatorIndex: 123456,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 32000000000n, // 32 ETH in Gwei
});

console.log("Full withdrawal (validator exit):");
console.log("  Index:", fullWithdrawal.index);
console.log("  Validator:", fullWithdrawal.validatorIndex);
console.log("  Amount:", fullWithdrawal.amount, "Gwei (32 ETH)");

// Create a partial withdrawal (rewards sweep)
const partialWithdrawal = Withdrawal.from({
	index: 1000001n,
	validatorIndex: 123456,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 150000000n, // 0.15 ETH in Gwei
});

console.log("\nPartial withdrawal (rewards):");
console.log("  Index:", partialWithdrawal.index);
console.log("  Validator:", partialWithdrawal.validatorIndex);
console.log("  Amount:", partialWithdrawal.amount, "Gwei (0.15 ETH)");

// Withdrawals are processed automatically by the protocol
// Full withdrawals occur when validator exits or is slashed
// Partial withdrawals occur for rewards when balance > 32 ETH

// Compare withdrawals
const duplicate = Withdrawal.from({
	index: 1000000n,
	validatorIndex: 123456,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 32000000000n,
});

console.log("\nComparing withdrawals:");
console.log("  Equal:", Withdrawal.equals(fullWithdrawal, duplicate)); // true
console.log(
	"  Different:",
	Withdrawal.equals(fullWithdrawal, partialWithdrawal),
); // false

// Mixed input types supported
const mixedTypes = Withdrawal.from({
	index: "1000002", // string
	validatorIndex: 123457n, // bigint
	address: new Uint8Array(20), // bytes
	amount: "0x77359400", // hex string
});

console.log("\nMixed input types:");
console.log("  Index:", mixedTypes.index);
console.log("  Validator:", mixedTypes.validatorIndex);
console.log("  Amount:", mixedTypes.amount, "Gwei");
