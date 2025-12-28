
import { Address, BlockBody, Hex, Transaction, Bytes, Bytes32 } from "@tevm/voltaire";
const emptyBody = BlockBody({
	transactions: [],
	ommers: [],
});
// Create sample transactions
const tx1: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20_000_000_000n,
	gasLimit: 21_000n,
	to: Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n,
	data: Bytes.zero(0),
	v: 27n,
	r: Bytes32.zero(),
	s: Bytes32.zero(),
};

const tx2: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 1n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 30_000_000_000n,
	gasLimit: 50_000n,
	to: Address("0xd8da6bf26964af9d7eed9e03e53415d37aa96045"),
	value: 0n,
	data: Hex.fromString("0x1234").bytes,
	accessList: [],
	yParity: 0,
	r: Bytes32.zero(),
	s: Bytes32.zero(),
};

const bodyWithTxs = BlockBody({
	transactions: [tx1, tx2],
	ommers: [],
});
const postShanghaiBody = BlockBody({
	transactions: [tx1],
	ommers: [],
	withdrawals: [
		{
			index: 12345n,
			validatorIndex: 98765n,
			address: Address("0x5aAed5937020b9EB3Cd462dDbAefA21DA757f30f"),
			amount: 32_000_000_000n, // 32 ETH in Gwei
		},
	],
});
if (postShanghaiBody.withdrawals) {
}
