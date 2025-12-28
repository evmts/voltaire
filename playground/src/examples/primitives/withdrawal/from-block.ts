import { Withdrawal } from "voltaire";
// First Shanghai block with withdrawals (17,034,870)
const shanghaiFirst = [
	Withdrawal.from({
		index: 0n,
		validatorIndex: 0,
		address: "0x8bBe03F3e48391a3aC1Ee5e09e23e5b8F5E4c078",
		amount: 1n,
	}),
];

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

const totalEth =
	typicalBlock.reduce((sum, w) => sum + Number(w.amount), 0) / 1_000_000_000;

// Full block (16 withdrawals)
const maxBlock = Array.from({ length: 16 }, (_, i) =>
	Withdrawal.from({
		index: 2000000n + BigInt(i),
		validatorIndex: 200000 + i,
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 50000000n,
	}),
);

// Empty block (no withdrawals)
const emptyBlock: typeof typicalBlock = [];

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
const highTotal =
	highValueBlock.reduce((sum, w) => sum + Number(w.amount), 0) / 1_000_000_000;

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
