import * as Address from "../../../primitives/Address/index.js";
import * as Block from "../../../primitives/Block/index.js";
import * as BlockBody from "../../../primitives/BlockBody/index.js";
import * as BlockHash from "../../../primitives/BlockHash/index.js";
import * as BlockHeader from "../../../primitives/BlockHeader/index.js";
import type { Any as AnyTransaction } from "../../../primitives/Transaction/types.js";

// Create sample transactions (simplified)
const tx1: AnyTransaction = {
	type: 0x02, // EIP-1559
	chainId: 1n,
	nonce: 42n,
	maxPriorityFeePerGas: 2000000000n,
	maxFeePerGas: 50000000000n,
	gasLimit: 21000n,
	to: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1000000000000000000n, // 1 ETH
	data: new Uint8Array(0),
	accessList: [],
	yParity: 1,
	r: new Uint8Array(32).fill(0x11),
	s: new Uint8Array(32).fill(0x22),
};

const tx2: AnyTransaction = {
	type: 0x02, // EIP-1559
	chainId: 1n,
	nonce: 15n,
	maxPriorityFeePerGas: 1500000000n,
	maxFeePerGas: 45000000000n,
	gasLimit: 51000n,
	to: Address.fromHex("0xd8da6bf26964af9d7eed9e03e53415d37aa96045"),
	value: 500000000000000000n, // 0.5 ETH
	data: new Uint8Array(4).fill(0xab), // Contract call
	accessList: [],
	yParity: 0,
	r: new Uint8Array(32).fill(0x33),
	s: new Uint8Array(32).fill(0x44),
};

const tx3: AnyTransaction = {
	type: 0x02, // EIP-1559
	chainId: 1n,
	nonce: 127n,
	maxPriorityFeePerGas: 3000000000n,
	maxFeePerGas: 60000000000n,
	gasLimit: 100000n,
	to: Address.fromHex("0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326"),
	value: 0n, // Contract interaction
	data: new Uint8Array(68).fill(0xcd), // Larger calldata
	accessList: [],
	yParity: 1,
	r: new Uint8Array(32).fill(0x55),
	s: new Uint8Array(32).fill(0x66),
};

// Create block header
const header = BlockHeader.from({
	parentHash:
		"0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326",
	stateRoot:
		"0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
	transactionsRoot:
		"0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
	receiptsRoot:
		"0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
	logsBloom: new Uint8Array(256),
	difficulty: 0n,
	number: 19426587n,
	gasLimit: 30000000n,
	gasUsed: 172000n, // Sum of gas from all transactions
	timestamp: 1710338455n,
	extraData: new Uint8Array(0),
	mixHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
	nonce: new Uint8Array(8),
	baseFeePerGas: 15000000000n, // 15 gwei
});

// Create block body with transactions
const body = BlockBody.from({
	transactions: [tx1, tx2, tx3],
	ommers: [],
});

// Create block
const block = Block.from({
	header,
	body,
	hash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
	size: 1247n,
});
block.body.transactions.forEach((tx, index) => {
	if ("to" in tx && tx.to !== null) {
	} else {
	}

	if ("maxFeePerGas" in tx) {
	}

	if ("gasPrice" in tx) {
	}
});

// Calculate total value transferred
const totalValue = block.body.transactions.reduce(
	(sum, tx) => sum + tx.value,
	0n,
);

// Identify transaction types
const typeCount = block.body.transactions.reduce(
	(counts, tx) => {
		const type = tx.type;
		counts[type] = (counts[type] || 0) + 1;
		return counts;
	},
	{} as Record<number, number>,
);
