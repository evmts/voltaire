import { Withdrawal } from "@tevm/voltaire";
// Sequential withdrawals in a single block
const block1 = [
	Withdrawal({
		index: 20000000n,
		validatorIndex: 100000,
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 32000000000n, // Full withdrawal
	}),
	Withdrawal({
		index: 20000001n,
		validatorIndex: 100025,
		address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
		amount: 50000000n, // Partial withdrawal
	}),
	Withdrawal({
		index: 20000002n,
		validatorIndex: 100050,
		address: "0x5aAed5930B9EB3cd462dDbaEfA21Da757F30FbDd",
		amount: 32500000000n, // Full withdrawal with rewards
	}),
];
block1.forEach((w, i) => {});

// Full block (16 withdrawals max)
const fullBlock = Array.from({ length: 16 }, (_, i) =>
	Withdrawal({
		index: 20100000n + BigInt(i),
		validatorIndex: 200000 + i * 25, // Spaced validators
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 50000000n, // All partial withdrawals
	}),
);

// Validator sweep cycle
const totalValidators = 500000;
const withdrawalsPerBlock = 16;
const blocksPerDay = 7200; // 12 seconds per block
const withdrawalsPerDay = withdrawalsPerBlock * blocksPerDay;
const cycleDays = totalValidators / withdrawalsPerDay;

// Estimating your withdrawal
const yourValidatorIndex = 123456;
const currentSweepIndex = 100000;
const indexDifference =
	yourValidatorIndex > currentSweepIndex
		? yourValidatorIndex - currentSweepIndex
		: totalValidators - currentSweepIndex + yourValidatorIndex;
const daysUntilWithdrawal = indexDifference / withdrawalsPerDay;

// Block with mix of full and partial
const mixedBlock = [
	Withdrawal({
		index: 20200000n,
		validatorIndex: 300000,
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 32000000000n, // Full
	}),
	Withdrawal({
		index: 20200001n,
		validatorIndex: 300025,
		address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
		amount: 45000000n, // Partial
	}),
	Withdrawal({
		index: 20200002n,
		validatorIndex: 300050,
		address: "0x5aAed5930B9EB3cd462dDbaEfA21Da757F30FbDd",
		amount: 50000000n, // Partial
	}),
];

const totalAmount = mixedBlock.reduce((sum, w) => sum + Number(w.amount), 0);
