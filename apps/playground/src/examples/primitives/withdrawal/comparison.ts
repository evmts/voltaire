import { Withdrawal } from "@tevm/voltaire";
// Identical withdrawals
const withdrawal1 = Withdrawal({
	index: 1000000n,
	validatorIndex: 123456,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 32000000000n,
});

const withdrawal2 = Withdrawal({
	index: 1000000n,
	validatorIndex: 123456,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 32000000000n,
});

// Different index
const differentIndex = Withdrawal({
	index: 1000001n, // Different
	validatorIndex: 123456,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 32000000000n,
});

// Different validator
const differentValidator = Withdrawal({
	index: 1000000n,
	validatorIndex: 123457, // Different
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 32000000000n,
});

// Different address
const differentAddress = Withdrawal({
	index: 1000000n,
	validatorIndex: 123456,
	address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045", // Different
	amount: 32000000000n,
});

// Different amount
const differentAmount = Withdrawal({
	index: 1000000n,
	validatorIndex: 123456,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 32000000001n, // Different
});

// Sorting withdrawals by index
const unsorted = [
	Withdrawal({
		index: 3n,
		validatorIndex: 300,
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 32000000000n,
	}),
	Withdrawal({
		index: 1n,
		validatorIndex: 100,
		address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
		amount: 32000000000n,
	}),
	Withdrawal({
		index: 2n,
		validatorIndex: 200,
		address: "0x5aAed5930B9EB3cd462dDbaEfA21Da757F30FbDd",
		amount: 32000000000n,
	}),
];

const sorted = [...unsorted].sort((a, b) => Number(a.index - b.index));

// Finding specific withdrawal
const withdrawals = [withdrawal1, differentIndex, differentValidator];
const targetIndex = 1000001n;
const found = withdrawals.find((w) => w.index === targetIndex);
if (found) {
}

// Grouping by validator
const multipleWithdrawals = [
	Withdrawal({
		index: 1n,
		validatorIndex: 100,
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 50000000n,
	}),
	Withdrawal({
		index: 2n,
		validatorIndex: 100,
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 45000000n,
	}),
	Withdrawal({
		index: 3n,
		validatorIndex: 200,
		address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
		amount: 32000000000n,
	}),
];

const grouped = multipleWithdrawals.reduce(
	(acc, w) => {
		const key = w.validatorIndex;
		if (!acc[key]) acc[key] = [];
		acc[key].push(w);
		return acc;
	},
	{} as Record<number, typeof multipleWithdrawals>,
);
Object.entries(grouped).forEach(([validator, wds]) => {
	const total = wds.reduce((sum, w) => sum + Number(w.amount), 0);
});

// Filtering by amount threshold
const threshold = 1000000000n; // 1 ETH
const large = multipleWithdrawals.filter((w) => w.amount >= threshold);
const small = multipleWithdrawals.filter((w) => w.amount < threshold);
