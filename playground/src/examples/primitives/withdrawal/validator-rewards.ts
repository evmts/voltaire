import * as Withdrawal from "../../../primitives/Withdrawal/index.js";

// Baseline validator (good performance)
const baselineValidator = Withdrawal.from({
	index: 10000000n,
	validatorIndex: 500000,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 45000000n, // 0.045 ETH (~1 week)
});

// Sync committee member (higher rewards)
const syncCommittee = Withdrawal.from({
	index: 10000001n,
	validatorIndex: 500001,
	address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
	amount: 120000000n, // 0.12 ETH (sync committee period)
});

// Block proposer rewards
const blockProposer = Withdrawal.from({
	index: 10000002n,
	validatorIndex: 500002,
	address: "0x5aAed5930B9EB3cd462dDbaEfA21Da757F30FbDd",
	amount: 85000000n, // 0.085 ETH (includes proposer reward)
});

// Perfect validator (100% uptime)
const perfectValidator = Withdrawal.from({
	index: 10000003n,
	validatorIndex: 500003,
	address: "0x8bBe03F3e48391a3aC1Ee5e09e23e5b8F5E4c078",
	amount: 52000000n, // 0.052 ETH (1 week, 100%)
});

// Poor performing validator
const poorValidator = Withdrawal.from({
	index: 10000004n,
	validatorIndex: 500004,
	address: "0x0000000000000000000000000000000000000001",
	amount: 25000000n, // 0.025 ETH (missed attestations)
});

// Slashing whistleblower reward
const whistleblower = Withdrawal.from({
	index: 10000005n,
	validatorIndex: 500005,
	address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	amount: 65000000n, // 0.065 ETH (whistleblower + normal)
});
