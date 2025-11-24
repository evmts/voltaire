import * as Withdrawal from "../../../primitives/Withdrawal/index.js";

// Example: Validator rewards and withdrawal amounts

// Validator rewards come from:
// 1. Attestation rewards (voting on correct head/source/target)
// 2. Sync committee rewards (selected validators)
// 3. Proposer rewards (block proposals)
// 4. Slashing whistleblower rewards

console.log("Validator Rewards & Withdrawals");
console.log("================================\n");

// Baseline validator (good performance)
const baselineValidator = Withdrawal.from({
	index: 10000000n,
	validatorIndex: 500000,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 45000000n, // 0.045 ETH (~1 week)
});

console.log("Baseline validator (1 week):");
console.log("  Validator:", baselineValidator.validatorIndex);
console.log("  Amount:", baselineValidator.amount, "Gwei");
console.log("  ETH:", Number(baselineValidator.amount) / 1_000_000_000);
console.log("  Performance: 95% attestation rate");
console.log("  APR: ~3.8%");

// Sync committee member (higher rewards)
const syncCommittee = Withdrawal.from({
	index: 10000001n,
	validatorIndex: 500001,
	address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
	amount: 120000000n, // 0.12 ETH (sync committee period)
});

console.log("\nSync committee member:");
console.log("  Validator:", syncCommittee.validatorIndex);
console.log("  Amount:", syncCommittee.amount, "Gwei");
console.log("  ETH:", Number(syncCommittee.amount) / 1_000_000_000);
console.log("  Period: 256 epochs (~27 hours)");
console.log("  Extra rewards: ~2x normal");
console.log("  Frequency: ~1-2 times per year");

// Block proposer rewards
const blockProposer = Withdrawal.from({
	index: 10000002n,
	validatorIndex: 500002,
	address: "0x5aAed5930B9EB3cd462dDbaEfA21Da757F30FbDd",
	amount: 85000000n, // 0.085 ETH (includes proposer reward)
});

console.log("\nBlock proposer:");
console.log("  Validator:", blockProposer.validatorIndex);
console.log("  Amount:", blockProposer.amount, "Gwei");
console.log("  ETH:", Number(blockProposer.amount) / 1_000_000_000);
console.log("  Base rewards: 0.045 ETH");
console.log("  Proposer reward: 0.04 ETH");
console.log("  Blocks proposed: 1");

// Perfect validator (100% uptime)
const perfectValidator = Withdrawal.from({
	index: 10000003n,
	validatorIndex: 500003,
	address: "0x8bBe03F3e48391a3aC1Ee5e09e23e5b8F5E4c078",
	amount: 52000000n, // 0.052 ETH (1 week, 100%)
});

console.log("\nPerfect validator:");
console.log("  Validator:", perfectValidator.validatorIndex);
console.log("  Amount:", perfectValidator.amount, "Gwei");
console.log("  ETH:", Number(perfectValidator.amount) / 1_000_000_000);
console.log("  Uptime: 100%");
console.log("  Attestations: All successful");
console.log("  APR: ~4.3%");

// Poor performing validator
const poorValidator = Withdrawal.from({
	index: 10000004n,
	validatorIndex: 500004,
	address: "0x0000000000000000000000000000000000000001",
	amount: 25000000n, // 0.025 ETH (missed attestations)
});

console.log("\nPoor performing validator:");
console.log("  Validator:", poorValidator.validatorIndex);
console.log("  Amount:", poorValidator.amount, "Gwei");
console.log("  ETH:", Number(poorValidator.amount) / 1_000_000_000);
console.log("  Attestation rate: 70%");
console.log("  APR: ~2.0%");
console.log("  Issue: Network connectivity");

// Slashing whistleblower reward
const whistleblower = Withdrawal.from({
	index: 10000005n,
	validatorIndex: 500005,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 65000000n, // 0.065 ETH (whistleblower + normal)
});

console.log("\nSlashing whistleblower:");
console.log("  Validator:", whistleblower.validatorIndex);
console.log("  Amount:", whistleblower.amount, "Gwei");
console.log("  ETH:", Number(whistleblower.amount) / 1_000_000_000);
console.log("  Normal rewards: 0.045 ETH");
console.log("  Whistleblower: 0.02 ETH");
console.log("  Action: Reported slashable offense");

// Rewards breakdown
console.log("\nTypical weekly rewards breakdown:");
console.log("  Base APR: 3.8%");
console.log("  Attestation: 0.035 ETH");
console.log("  Inclusion delay: 0.005 ETH");
console.log("  Sync committee: 0.005 ETH (if selected)");
console.log("  Total: ~0.045 ETH per week");
