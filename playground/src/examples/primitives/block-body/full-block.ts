import { Address, BlockBody, Transaction } from "voltaire";
// Full Block: Create block body with many transactions

// Generate many transactions to simulate full block
const transactions: Transaction.Any[] = [];

// Add 20 legacy transactions
for (let i = 0; i < 20; i++) {
	transactions.push({
		type: Transaction.Type.Legacy,
		nonce: BigInt(i),
		gasPrice: 20_000_000_000n,
		gasLimit: 21_000n,
		to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
		value: BigInt(i) * 1_000_000_000_000_000n, // Varying amounts
		data: new Uint8Array(),
		v: 27n,
		r: new Uint8Array(32),
		s: new Uint8Array(32),
	});
}

// Add 15 EIP-1559 transactions
for (let i = 0; i < 15; i++) {
	transactions.push({
		type: Transaction.Type.EIP1559,
		chainId: 1n,
		nonce: BigInt(i + 100),
		maxPriorityFeePerGas: 2_000_000_000n,
		maxFeePerGas: 30_000_000_000n,
		gasLimit: 50_000n,
		to: Address.from("0xd8da6bf26964af9d7eed9e03e53415d37aa96045"),
		value: 0n,
		data: new Uint8Array([0x12, 0x34]),
		accessList: [],
		yParity: i % 2,
		r: new Uint8Array(32),
		s: new Uint8Array(32),
	});
}

// Add 10 contract creation transactions (to: null)
for (let i = 0; i < 10; i++) {
	transactions.push({
		type: Transaction.Type.EIP1559,
		chainId: 1n,
		nonce: BigInt(i + 200),
		maxPriorityFeePerGas: 3_000_000_000n,
		maxFeePerGas: 40_000_000_000n,
		gasLimit: 2_000_000n, // More gas for contract creation
		to: null, // Contract creation
		value: 0n,
		data: new Uint8Array(1000), // Contract bytecode
		accessList: [],
		yParity: 0,
		r: new Uint8Array(32),
		s: new Uint8Array(32),
	});
}

const fullBlock = BlockBody.from({
	transactions,
	ommers: [],
});
const typeCounts = fullBlock.transactions.reduce(
	(acc, tx) => {
		const type = tx.type;
		acc[type] = (acc[type] || 0) + 1;
		return acc;
	},
	{} as Record<number, number>,
);
const totalGasLimit = fullBlock.transactions.reduce(
	(sum, tx) => sum + tx.gasLimit,
	0n,
);
const contractCreations = fullBlock.transactions.filter(
	(tx) => tx.to === null,
).length;
const totalValue = fullBlock.transactions.reduce(
	(sum, tx) => sum + tx.value,
	0n,
);
