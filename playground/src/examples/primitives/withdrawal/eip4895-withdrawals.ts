import * as Withdrawal from "../../../primitives/Withdrawal/index.js";

// Example: EIP-4895 Shanghai withdrawals

// EIP-4895 was activated in the Shanghai upgrade (April 12, 2023)
// It introduced the ability to withdraw staked ETH from the beacon chain

// Before Shanghai: ETH could only be deposited to beacon chain validators
// After Shanghai: ETH can be withdrawn back to execution layer addresses

// Withdrawal processing:
// - Up to 16 withdrawals per block
// - Automatic processing by protocol (no transaction needed)
// - Validators are swept in order (round-robin)
// - Full sweep cycle takes ~4-5 days for 500k validators

console.log("EIP-4895: Beacon Chain Push Withdrawals");
console.log("========================================\n");

// First withdrawal after Shanghai (block 17,034,870)
const firstWithdrawal = Withdrawal.from({
	index: 0n,
	validatorIndex: 0,
	address: "0x8bBe03F3e48391a3aC1Ee5e09e23e5b8F5E4c078",
	amount: 1n, // Very small test amount
});

console.log("First Shanghai withdrawal:");
console.log("  Block: 17,034,870");
console.log("  Index:", firstWithdrawal.index);
console.log("  Validator:", firstWithdrawal.validatorIndex);
console.log("  Amount:", firstWithdrawal.amount, "Gwei");

// Typical validator exit withdrawal (32 ETH)
const validatorExit = Withdrawal.from({
	index: 1000000n,
	validatorIndex: 500000,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 32000000000n, // Full 32 ETH stake
});

console.log("\nValidator exit withdrawal:");
console.log("  Index:", validatorExit.index);
console.log("  Validator:", validatorExit.validatorIndex);
console.log("  Amount:", validatorExit.amount, "Gwei (32 ETH)");

// Rewards withdrawal (excess over 32 ETH)
const rewardsWithdrawal = Withdrawal.from({
	index: 1000001n,
	validatorIndex: 500001,
	address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
	amount: 250000000n, // 0.25 ETH rewards
});

console.log("\nRewards withdrawal:");
console.log("  Index:", rewardsWithdrawal.index);
console.log("  Validator:", rewardsWithdrawal.validatorIndex);
console.log("  Amount:", rewardsWithdrawal.amount, "Gwei (0.25 ETH)");

// Block with maximum withdrawals (16)
console.log("\nBlock withdrawal limits:");
console.log("  Max per block: 16 withdrawals");
console.log("  Gas cost: 0 (no transaction needed)");
console.log("  Processing: Automatic by protocol");

const blockWithdrawals = Array.from({ length: 16 }, (_, i) =>
	Withdrawal.from({
		index: 2000000n + BigInt(i),
		validatorIndex: 600000 + i,
		address: "0x0000000000000000000000000000000000000000",
		amount: 1000000000n, // 1 ETH each
	}),
);

console.log("\nFull block withdrawals:");
console.log("  Count:", blockWithdrawals.length);
console.log("  Total amount:", blockWithdrawals.length * 1, "ETH");
