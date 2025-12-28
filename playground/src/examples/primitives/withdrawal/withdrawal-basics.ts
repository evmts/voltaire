import { Withdrawal, Bytes } from "@tevm/voltaire";
// Example: Withdrawal basics (EIP-4895 Shanghai upgrade)

// EIP-4895 introduced withdrawals in the Shanghai upgrade (April 2023)
// Withdrawals enable ETH transfer from beacon chain validators to execution layer

// Withdrawal structure has 4 fields:
// - index: Global withdrawal counter (monotonically increasing)
// - validatorIndex: Validator's index on beacon chain
// - address: Execution layer address receiving funds
// - amount: Amount in Gwei (1 ETH = 1,000,000,000 Gwei)

// Create a full withdrawal (validator exit, 32 ETH)
const fullWithdrawal = Withdrawal({
	index: 1000000n,
	validatorIndex: 123456,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 32000000000n, // 32 ETH in Gwei
});

// Create a partial withdrawal (rewards sweep)
const partialWithdrawal = Withdrawal({
	index: 1000001n,
	validatorIndex: 123456,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 150000000n, // 0.15 ETH in Gwei
});

// Withdrawals are processed automatically by the protocol
// Full withdrawals occur when validator exits or is slashed
// Partial withdrawals occur for rewards when balance > 32 ETH

// Compare withdrawals
const duplicate = Withdrawal({
	index: 1000000n,
	validatorIndex: 123456,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 32000000000n,
});

// Mixed input types supported
const mixedTypes = Withdrawal({
	index: "1000002", // string
	validatorIndex: 123457n, // bigint
	address: Bytes.zero(20), // bytes
	amount: "0x77359400", // hex string
});
