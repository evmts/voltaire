import { Withdrawal } from "voltaire";
// First withdrawal after Shanghai (block 17,034,870)
const firstWithdrawal = Withdrawal.from({
	index: 0n,
	validatorIndex: 0,
	address: "0x8bBe03F3e48391a3aC1Ee5e09e23e5b8F5E4c078",
	amount: 1n, // Very small test amount
});

// Typical validator exit withdrawal (32 ETH)
const validatorExit = Withdrawal.from({
	index: 1000000n,
	validatorIndex: 500000,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 32000000000n, // Full 32 ETH stake
});

// Rewards withdrawal (excess over 32 ETH)
const rewardsWithdrawal = Withdrawal.from({
	index: 1000001n,
	validatorIndex: 500001,
	address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
	amount: 250000000n, // 0.25 ETH rewards
});

const blockWithdrawals = Array.from({ length: 16 }, (_, i) =>
	Withdrawal.from({
		index: 2000000n + BigInt(i),
		validatorIndex: 600000 + i,
		address: "0x0000000000000000000000000000000000000000",
		amount: 1000000000n, // 1 ETH each
	}),
);
