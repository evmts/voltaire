import * as Block from "../../../primitives/Block/index.js";
import * as BlockBody from "../../../primitives/BlockBody/index.js";
import * as BlockHash from "../../../primitives/BlockHash/index.js";
import * as BlockHeader from "../../../primitives/BlockHeader/index.js";

// Simulated eth_getBlockByNumber RPC response (recent mainnet block)
const rpcResponse = {
	number: "0x12a7f27", // 19595047
	hash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
	parentHash:
		"0xf1e2d3c4b5a69788695041322314151617182919a1b1c1d1e1f2021222324252",
	sha3Uncles:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	miner: "0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326",
	stateRoot:
		"0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
	transactionsRoot:
		"0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
	receiptsRoot:
		"0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
	logsBloom:
		"0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
	difficulty: "0x0",
	totalDifficulty: "0xc70d815d562d3cfa955",
	size: "0xb1e2",
	gasLimit: "0x1c9c380",
	gasUsed: "0xd1a2b3",
	timestamp: "0x65e8c8b7",
	extraData: "0x",
	mixHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
	nonce: "0x0000000000000000",
	baseFeePerGas: "0x7a1225a00",
	withdrawalsRoot:
		"0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
	blobGasUsed: "0x40000",
	excessBlobGas: "0x20000",
	parentBeaconBlockRoot:
		"0xe5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
	transactions: [], // Transaction hashes or full transactions
	uncles: [], // Uncle block hashes
	withdrawals: [], // Withdrawal objects
};

// Convert hex strings to appropriate types
const parseHexToBigInt = (hex: string): bigint => BigInt(hex);
const parseHexToBytes = (hex: string): Uint8Array => {
	const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(cleaned.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
};

// Create block header from RPC data
const header = BlockHeader.from({
	parentHash: rpcResponse.parentHash,
	ommersHash: rpcResponse.sha3Uncles,
	beneficiary: rpcResponse.miner,
	stateRoot: rpcResponse.stateRoot,
	transactionsRoot: rpcResponse.transactionsRoot,
	receiptsRoot: rpcResponse.receiptsRoot,
	logsBloom: parseHexToBytes(rpcResponse.logsBloom),
	difficulty: parseHexToBigInt(rpcResponse.difficulty),
	number: parseHexToBigInt(rpcResponse.number),
	gasLimit: parseHexToBigInt(rpcResponse.gasLimit),
	gasUsed: parseHexToBigInt(rpcResponse.gasUsed),
	timestamp: parseHexToBigInt(rpcResponse.timestamp),
	extraData: parseHexToBytes(rpcResponse.extraData),
	mixHash: rpcResponse.mixHash,
	nonce: parseHexToBytes(rpcResponse.nonce),
	baseFeePerGas: parseHexToBigInt(rpcResponse.baseFeePerGas),
	withdrawalsRoot: rpcResponse.withdrawalsRoot,
	blobGasUsed: parseHexToBigInt(rpcResponse.blobGasUsed),
	excessBlobGas: parseHexToBigInt(rpcResponse.excessBlobGas),
	parentBeaconBlockRoot: rpcResponse.parentBeaconBlockRoot,
});

// Create block body from RPC data
const body = BlockBody.from({
	transactions: rpcResponse.transactions, // Would parse transaction objects
	ommers: [], // Would parse uncle blocks
	withdrawals: [], // Would parse withdrawal objects
});

// Create complete block
const block = Block.from({
	header,
	body,
	hash: rpcResponse.hash,
	size: parseHexToBigInt(rpcResponse.size),
	totalDifficulty: parseHexToBigInt(rpcResponse.totalDifficulty),
});
