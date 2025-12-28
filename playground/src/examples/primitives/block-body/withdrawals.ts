import { Address, BlockBody, Transaction } from "voltaire";
// Withdrawals: EIP-4895 post-Shanghai block withdrawals

// Create sample transaction
const tx: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20_000_000_000n,
	gasLimit: 21_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	v: 27n,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

// Post-Shanghai block with validator withdrawals
const blockWithWithdrawals = BlockBody.from({
	transactions: [tx],
	ommers: [],
	withdrawals: [
		{
			index: 1000n,
			validatorIndex: 12345n,
			address: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
			amount: 32_000_000_000n, // 32 ETH in Gwei (full validator exit)
		},
		{
			index: 1001n,
			validatorIndex: 12346n,
			address: Address.from("0xd8da6bf26964af9d7eed9e03e53415d37aa96045"),
			amount: 64_000_000n, // Partial withdrawal (rewards only)
		},
		{
			index: 1002n,
			validatorIndex: 12347n,
			address: Address.from("0x5aAed5937020b9EB3Cd462dDbAefA21DA757f30f"),
			amount: 32_000_000_000n,
		},
	],
});
blockWithWithdrawals.withdrawals?.forEach((withdrawal, i) => {});
const totalWithdrawn =
	blockWithWithdrawals.withdrawals?.reduce((sum, w) => sum + w.amount, 0n) ||
	0n;
const preShanghaiBlock = BlockBody.from({
	transactions: [tx],
	ommers: [],
});
