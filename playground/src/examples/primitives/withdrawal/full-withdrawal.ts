import { Withdrawal } from "@tevm/voltaire";
// Scenario 1: Voluntary exit (full 32 ETH)
const voluntaryExit = Withdrawal({
	index: 5000000n,
	validatorIndex: 250000,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 32000000000n, // Exactly 32 ETH
});

// Scenario 2: Exit with rewards (32 + accumulated rewards)
const exitWithRewards = Withdrawal({
	index: 5000001n,
	validatorIndex: 250001,
	address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
	amount: 32750000000n, // 32.75 ETH (32 + 0.75 rewards)
});

// Scenario 3: Ejection (balance fell below 16 ETH)
const ejection = Withdrawal({
	index: 5000002n,
	validatorIndex: 250002,
	address: "0x5aAed5930B9EB3cd462dDbaEfA21Da757F30FbDd",
	amount: 15500000000n, // 15.5 ETH (below ejection threshold)
});

// Scenario 4: Slashed validator exit
const slashedExit = Withdrawal({
	index: 5000003n,
	validatorIndex: 250003,
	address: "0x8bBe03F3e48391a3aC1Ee5e09e23e5b8F5E4c078",
	amount: 31250000000n, // 31.25 ETH (after slashing penalty)
});
