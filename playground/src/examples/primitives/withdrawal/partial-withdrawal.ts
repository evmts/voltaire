import { Withdrawal } from "@tevm/voltaire";
// Small rewards withdrawal (typical weekly amount)
const weeklyRewards = Withdrawal({
	index: 8000000n,
	validatorIndex: 400000,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 50000000n, // 0.05 ETH (typical weekly rewards)
});

// Larger rewards withdrawal (accumulated over time)
const monthlyRewards = Withdrawal({
	index: 8000001n,
	validatorIndex: 400001,
	address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
	amount: 250000000n, // 0.25 ETH (accumulated)
});

// High-performing validator rewards
const highPerformer = Withdrawal({
	index: 8000002n,
	validatorIndex: 400002,
	address: "0x5aAed5930B9EB3cd462dDbaEfA21Da757F30FbDd",
	amount: 500000000n, // 0.5 ETH (excellent performance)
});

// Validator with 0x01 withdrawal credentials
const credentialsSet = Withdrawal({
	index: 8000003n,
	validatorIndex: 400003,
	address: "0x8bBe03F3e48391a3aC1Ee5e09e23e5b8F5E4c078",
	amount: 150000000n, // 0.15 ETH
});

// Calculate APR from rewards
const principal = 32; // ETH
const weeklyRewardsEth = 0.05; // ETH
const annualRewards = weeklyRewardsEth * 52; // weeks per year
const apr = (annualRewards / principal) * 100;
