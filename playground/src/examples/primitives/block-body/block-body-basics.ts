import Address from "../../../primitives/Address/index.js";
import * as BlockBody from "../../../primitives/BlockBody/index.js";
import * as Hex from "../../../primitives/Hex/index.js";
import Transaction from "../../../primitives/Transaction/index.js";
const emptyBody = BlockBody.from({
	transactions: [],
	ommers: [],
});
// Create sample transactions
const tx1: Transaction.Legacy = {
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

const tx2: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 1n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 30_000_000_000n,
	gasLimit: 50_000n,
	to: Address.from("0xd8da6bf26964af9d7eed9e03e53415d37aa96045"),
	value: 0n,
	data: Hex.fromString("0x1234").bytes,
	accessList: [],
	yParity: 0,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

const bodyWithTxs = BlockBody.from({
	transactions: [tx1, tx2],
	ommers: [],
});
const postShanghaiBody = BlockBody.from({
	transactions: [tx1],
	ommers: [],
	withdrawals: [
		{
			index: 12345n,
			validatorIndex: 98765n,
			address: Address.from("0x5aAed5937020b9EB3Cd462dDbAefA21DA757f30f"),
			amount: 32_000_000_000n, // 32 ETH in Gwei
		},
	],
});
if (postShanghaiBody.withdrawals) {
}
