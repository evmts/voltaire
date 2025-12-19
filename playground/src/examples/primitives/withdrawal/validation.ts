import * as Withdrawal from "../../../primitives/Withdrawal/index.js";

// Valid withdrawal
try {
	const valid = Withdrawal.from({
		index: 1000000n,
		validatorIndex: 123456,
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 32000000000n,
	});
} catch (error) {}
try {
	Withdrawal.from({
		index: -1,
		validatorIndex: 123456,
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 32000000000n,
	});
} catch (error) {}
try {
	Withdrawal.from({
		index: 1000000n,
		validatorIndex: -1,
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 32000000000n,
	});
} catch (error) {}
try {
	Withdrawal.from({
		index: 1000000n,
		validatorIndex: 123456,
		address: "0xinvalid",
		amount: 32000000000n,
	});
} catch (error) {}
try {
	Withdrawal.from({
		index: 1000000n,
		validatorIndex: 123456,
		address: "0x742d35Cc",
		amount: 32000000000n,
	});
} catch (error) {}
try {
	const zero = Withdrawal.from({
		index: 1000000n,
		validatorIndex: 123456,
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 0n,
	});
} catch (error) {}
try {
	const large = Withdrawal.from({
		index: 1000000n,
		validatorIndex: 123456,
		address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		amount: 100000000000n, // 100 ETH (unlikely but valid)
	});
} catch (error) {}
const correctGwei = Withdrawal.from({
	index: 1000000n,
	validatorIndex: 123456,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 32000000000n, // 32 ETH in Gwei
});

const wrongWei = Withdrawal.from({
	index: 1000000n,
	validatorIndex: 123456,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 32000000000000000000n, // Would be Wei
});
