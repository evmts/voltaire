import Address from "../../../primitives/Address/index.js";
// Transaction List: Accessing and iterating block body transactions
import * as BlockBody from "../../../primitives/BlockBody/index.js";
import Transaction from "../../../primitives/Transaction/index.js";

// Create transactions of different types
const legacyTx: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 15_000_000_000n,
	gasLimit: 21_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 500_000_000_000_000_000n, // 0.5 ETH
	data: new Uint8Array(),
	v: 27n,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

const eip1559Tx: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 2n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 30_000_000_000n,
	gasLimit: 100_000n,
	to: Address.from("0xd8da6bf26964af9d7eed9e03e53415d37aa96045"),
	value: 0n,
	data: new Uint8Array([0x12, 0x34, 0x56, 0x78]),
	accessList: [],
	yParity: 1,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

const body = BlockBody.from({
	transactions: [legacyTx, eip1559Tx, legacyTx, eip1559Tx],
	ommers: [],
});
body.transactions.forEach((tx, index) => {});
const legacyCount = body.transactions.filter(
	(tx) => tx.type === Transaction.Type.Legacy,
).length;
const eip1559Count = body.transactions.filter(
	(tx) => tx.type === Transaction.Type.EIP1559,
).length;
const totalValue = body.transactions.reduce((sum, tx) => sum + tx.value, 0n);
