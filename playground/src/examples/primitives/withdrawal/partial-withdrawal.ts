import * as Withdrawal from "../../../primitives/Withdrawal/index.js";

// Example: Partial withdrawals (rewards sweep)

// Partial withdrawals automatically sweep rewards from validators
// They occur when validator balance > 32 ETH
// Validator continues validating after partial withdrawal

// Key characteristics:
// - Automatic (no action needed from staker)
// - Only withdraws excess above 32 ETH
// - Validator stays active
// - Happens during regular validator sweep

console.log("Partial Withdrawal (Rewards Sweep)");
console.log("===================================\n");

// Small rewards withdrawal (typical weekly amount)
const weeklyRewards = Withdrawal.from({
	index: 8000000n,
	validatorIndex: 400000,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 50000000n, // 0.05 ETH (typical weekly rewards)
});

console.log("Weekly rewards sweep:");
console.log("  Validator:", weeklyRewards.validatorIndex);
console.log("  Amount:", weeklyRewards.amount, "Gwei");
console.log("  ETH:", Number(weeklyRewards.amount) / 1_000_000_000);
console.log("  Frequency: Every 4-5 days");
console.log("  Validator balance after: 32 ETH");

// Larger rewards withdrawal (accumulated over time)
const monthlyRewards = Withdrawal.from({
	index: 8000001n,
	validatorIndex: 400001,
	address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
	amount: 250000000n, // 0.25 ETH (accumulated)
});

console.log("\nAccumulated rewards:");
console.log("  Validator:", monthlyRewards.validatorIndex);
console.log("  Amount:", monthlyRewards.amount, "Gwei");
console.log("  ETH:", Number(monthlyRewards.amount) / 1_000_000_000);
console.log("  Period: ~1 month of rewards");
console.log("  Validator status: Active");

// High-performing validator rewards
const highPerformer = Withdrawal.from({
	index: 8000002n,
	validatorIndex: 400002,
	address: "0x5aAed5930B9EB3cd462dDbaEfA21Da757F30FbDd",
	amount: 500000000n, // 0.5 ETH (excellent performance)
});

console.log("\nHigh-performing validator:");
console.log("  Validator:", highPerformer.validatorIndex);
console.log("  Amount:", highPerformer.amount, "Gwei");
console.log("  ETH:", Number(highPerformer.amount) / 1_000_000_000);
console.log("  Attestation rate: >99%");
console.log("  Sync committee: Participated");

// Validator with 0x01 withdrawal credentials
const credentialsSet = Withdrawal.from({
	index: 8000003n,
	validatorIndex: 400003,
	address: "0x8bBe03F3e48391a3aC1Ee5e09e23e5b8F5E4c078",
	amount: 150000000n, // 0.15 ETH
});

console.log("\nValidator with 0x01 credentials:");
console.log("  Validator:", credentialsSet.validatorIndex);
console.log("  Amount:", credentialsSet.amount, "Gwei");
console.log("  ETH:", Number(credentialsSet.amount) / 1_000_000_000);
console.log("  Credentials: 0x01 (withdrawal address set)");
console.log("  Auto-sweep: Enabled");

// Calculate APR from rewards
const principal = 32; // ETH
const weeklyRewardsEth = 0.05; // ETH
const annualRewards = weeklyRewardsEth * 52; // weeks per year
const apr = (annualRewards / principal) * 100;

console.log("\nAPR calculation:");
console.log("  Principal:", principal, "ETH");
console.log("  Weekly rewards:", weeklyRewardsEth, "ETH");
console.log("  Annual rewards:", annualRewards.toFixed(2), "ETH");
console.log("  APR:", apr.toFixed(2) + "%");

// Withdrawal frequency
console.log("\nWithdrawal frequency:");
console.log("  Validators: ~500,000 active");
console.log("  Sweep rate: ~27,000 per day");
console.log("  Full cycle: ~4-5 days");
console.log("  Your validator: Swept every 4-5 days");
