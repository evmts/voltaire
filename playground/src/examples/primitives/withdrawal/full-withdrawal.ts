import * as Withdrawal from "../../../primitives/Withdrawal/index.js";

// Example: Full withdrawals (validator exit)

// Full withdrawals occur when:
// 1. Validator voluntarily exits
// 2. Validator is ejected (balance drops below 16 ETH)
// 3. Validator is slashed for malicious behavior

// A full withdrawal transfers the entire validator balance
// After full withdrawal, validator is permanently exited

console.log("Full Withdrawal Scenarios");
console.log("=========================\n");

// Scenario 1: Voluntary exit (full 32 ETH)
const voluntaryExit = Withdrawal.from({
	index: 5000000n,
	validatorIndex: 250000,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 32000000000n, // Exactly 32 ETH
});

console.log("Voluntary exit:");
console.log("  Validator:", voluntaryExit.validatorIndex);
console.log("  Amount:", voluntaryExit.amount, "Gwei");
console.log("  ETH:", Number(voluntaryExit.amount) / 1_000_000_000);
console.log("  Reason: Staker decided to exit");

// Scenario 2: Exit with rewards (32 + accumulated rewards)
const exitWithRewards = Withdrawal.from({
	index: 5000001n,
	validatorIndex: 250001,
	address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
	amount: 32750000000n, // 32.75 ETH (32 + 0.75 rewards)
});

console.log("\nExit with accumulated rewards:");
console.log("  Validator:", exitWithRewards.validatorIndex);
console.log("  Amount:", exitWithRewards.amount, "Gwei");
console.log("  ETH:", Number(exitWithRewards.amount) / 1_000_000_000);
console.log("  Principal: 32 ETH");
console.log("  Rewards: 0.75 ETH");

// Scenario 3: Ejection (balance fell below 16 ETH)
const ejection = Withdrawal.from({
	index: 5000002n,
	validatorIndex: 250002,
	address: "0x5aAed5930B9EB3cd462dDbaEfA21Da757F30FbDd",
	amount: 15500000000n, // 15.5 ETH (below ejection threshold)
});

console.log("\nEjection (balance too low):");
console.log("  Validator:", ejection.validatorIndex);
console.log("  Amount:", ejection.amount, "Gwei");
console.log("  ETH:", Number(ejection.amount) / 1_000_000_000);
console.log("  Reason: Balance dropped below 16 ETH");
console.log("  Status: Automatically ejected");

// Scenario 4: Slashed validator exit
const slashedExit = Withdrawal.from({
	index: 5000003n,
	validatorIndex: 250003,
	address: "0x8bBe03F3e48391a3aC1Ee5e09e23e5b8F5E4c078",
	amount: 31250000000n, // 31.25 ETH (after slashing penalty)
});

console.log("\nSlashed validator exit:");
console.log("  Validator:", slashedExit.validatorIndex);
console.log("  Amount:", slashedExit.amount, "Gwei");
console.log("  ETH:", Number(slashedExit.amount) / 1_000_000_000);
console.log("  Original: 32 ETH");
console.log("  Penalty: 0.75 ETH");
console.log("  Reason: Slashing for protocol violation");

// Timeline for voluntary exit
console.log("\nVoluntary exit timeline:");
console.log("  1. Submit exit transaction to beacon chain");
console.log("  2. Wait for exit queue (variable, can be days)");
console.log("  3. Validator stops attesting");
console.log("  4. Wait for withdrawable epoch (~27 hours)");
console.log("  5. Withdrawal processed automatically");
console.log("  6. ETH arrives in execution layer address");
