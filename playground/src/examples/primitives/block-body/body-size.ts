import { Address, BlockBody, Transaction, Bytes, Bytes32 } from "@tevm/voltaire";
// Body Size: Calculate and analyze block body size metrics

// Helper to estimate transaction size
function estimateTxSize(tx: Transaction.Any): number {
	let size = 0;

	// Type prefix (1 byte for typed transactions)
	if (tx.type !== Transaction.Type.Legacy) {
		size += 1;
	}

	// Common fields
	size += 32; // nonce (variable, but max 32 bytes)
	size += 32; // gas price/fees (variable)
	size += 32; // gas limit (variable)
	size += 20; // to address (or 0 for contract creation)
	size += 32; // value (variable)
	size += tx.data.length; // data payload

	// Signature
	size += 65; // r (32) + s (32) + v/yParity (1)

	// Type-specific fields
	if (tx.type !== Transaction.Type.Legacy) {
		size += 8; // chainId (variable)
	}

	return size;
}

// Create transactions of varying sizes
const smallTx: Transaction.Legacy = {
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

const mediumTx: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 1n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 30_000_000_000n,
	gasLimit: 100_000n,
	to: Address("0xd8da6bf26964af9d7eed9e03e53415d37aa96045"),
	value: 0n,
	data: Bytes.zero(256), // 256 bytes of data
	accessList: [],
	yParity: 0,
	r: Bytes32.zero(),
	s: Bytes32.zero(),
};

const largeTx: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 2n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 30_000_000_000n,
	gasLimit: 2_000_000n,
	to: null, // Contract creation
	value: 0n,
	data: Bytes.zero(10_000), // 10KB of contract bytecode
	accessList: [],
	yParity: 0,
	r: Bytes32.zero(),
	s: Bytes32.zero(),
};
const smallBlock = BlockBody({
	transactions: [smallTx, smallTx],
	ommers: [],
});

let smallBlockSize = 0;
smallBlock.transactions.forEach((tx) => {
	smallBlockSize += estimateTxSize(tx);
});
const mediumBlock = BlockBody({
	transactions: [smallTx, smallTx, mediumTx, mediumTx, mediumTx],
	ommers: [],
});

let mediumBlockSize = 0;
mediumBlock.transactions.forEach((tx) => {
	mediumBlockSize += estimateTxSize(tx);
});
const largeBlock = BlockBody({
	transactions: [largeTx, largeTx, mediumTx, mediumTx, smallTx],
	ommers: [],
});

let largeBlockSize = 0;
largeBlock.transactions.forEach((tx) => {
	largeBlockSize += estimateTxSize(tx);
});
[smallBlock, mediumBlock, largeBlock].forEach((block, i) => {
	const sizes = block.transactions.map((tx) => estimateTxSize(tx));
	const total = sizes.reduce((sum, s) => sum + s, 0);
	const avg = total / sizes.length;
	const min = Math.min(...sizes);
	const max = Math.max(...sizes);
});
const postShanghaiBlock = BlockBody({
	transactions: [smallTx, mediumTx],
	ommers: [],
	withdrawals: [
		{
			index: 1000n,
			validatorIndex: 12345n,
			address: Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
			amount: 32_000_000_000n,
		},
		{
			index: 1001n,
			validatorIndex: 12346n,
			address: Address("0xd8da6bf26964af9d7eed9e03e53415d37aa96045"),
			amount: 64_000_000n,
		},
	],
});

let postShanghaiSize = 0;
postShanghaiBlock.transactions.forEach((tx) => {
	postShanghaiSize += estimateTxSize(tx);
});
// Add ~44 bytes per withdrawal (index + validatorIndex + address + amount)
const withdrawalSize = (postShanghaiBlock.withdrawals?.length || 0) * 44;
postShanghaiSize += withdrawalSize;
