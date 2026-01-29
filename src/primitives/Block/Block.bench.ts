/**
 * Block Benchmarks: Voltaire TS vs viem
 *
 * Compares block parsing and hash calculation across implementations.
 */

import { bench, run } from "mitata";
import type { BlockHeaderType } from "../BlockHeader/BlockHeaderType.js";
import * as BlockHeader from "../BlockHeader/index.js";
import * as Block from "./index.js";

// ============================================================================
// Test Data - Realistic block data (Cancun format)
// ============================================================================

// RPC block format (from eth_getBlockByNumber)
const rpcBlock = {
	parentHash:
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	sha3Uncles:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	miner: "0x742d35cc6634c0532925a3b844bc9e7595f0beb0",
	stateRoot:
		"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
	transactionsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	receiptsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	logsBloom: "0x" + "00".repeat(256),
	difficulty: "0x0",
	number: "0x1234567",
	gasLimit: "0x1c9c380",
	gasUsed: "0x5208",
	timestamp: "0x65432100",
	extraData: "0x",
	mixHash:
		"0x0000000000000000000000000000000000000000000000000000000000000000",
	nonce: "0x0000000000000000",
	baseFeePerGas: "0x5f5e100",
	withdrawalsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	blobGasUsed: "0x0",
	excessBlobGas: "0x0",
	parentBeaconBlockRoot:
		"0x0000000000000000000000000000000000000000000000000000000000000000",
	hash: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
	size: "0x400",
	totalDifficulty: "0x0",
	transactions: [],
	withdrawals: [],
	uncles: [],
};

// RPC block with transactions
const rpcBlockWithTxs = {
	...rpcBlock,
	transactions: [
		{
			type: "0x2",
			chainId: "0x1",
			nonce: "0x0",
			maxPriorityFeePerGas: "0x3b9aca00",
			maxFeePerGas: "0x1bf08eb000",
			gas: "0x5208",
			to: "0x742d35cc6634c0532925a3b844bc9e7595f0beb0",
			value: "0xde0b6b3a7640000",
			input: "0x",
			accessList: [],
			v: "0x0",
			r: "0xb8c4f1c9b6b3a1c8d5e7f9a0b2c4d6e8f0a1b3c5d7e9f1a2b4c6d8e0f2a3b5c7",
			s: "0x0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1",
			hash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			blockHash:
				"0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
			blockNumber: "0x1234567",
			transactionIndex: "0x0",
			from: "0x1234567890123456789012345678901234567890",
			yParity: "0x0",
		},
	],
};

// RPC block with withdrawals
const rpcBlockWithWithdrawals = {
	...rpcBlock,
	withdrawals: [
		{
			index: "0x1",
			validatorIndex: "0x2",
			address: "0x742d35cc6634c0532925a3b844bc9e7595f0beb0",
			amount: "0x773594000",
		},
		{
			index: "0x2",
			validatorIndex: "0x3",
			address: "0x1234567890123456789012345678901234567890",
			amount: "0x3b9aca00",
		},
	],
};

// ============================================================================
// fromRpc Benchmarks
// ============================================================================

bench("Block.fromRpc - empty block", () => {
	Block.fromRpc(rpcBlock);
});

await run();

bench("Block.fromRpc - block with 1 tx", () => {
	Block.fromRpc(rpcBlockWithTxs);
});

await run();

bench("Block.fromRpc - block with withdrawals", () => {
	Block.fromRpc(rpcBlockWithWithdrawals);
});

await run();

// ============================================================================
// BlockHeader Benchmarks
// ============================================================================

const rpcHeader = {
	parentHash:
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	sha3Uncles:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	miner: "0x742d35cc6634c0532925a3b844bc9e7595f0beb0",
	stateRoot:
		"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
	transactionsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	receiptsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	logsBloom: "0x" + "00".repeat(256),
	difficulty: "0x0",
	number: "0x1234567",
	gasLimit: "0x1c9c380",
	gasUsed: "0x5208",
	timestamp: "0x65432100",
	extraData: "0x",
	mixHash:
		"0x0000000000000000000000000000000000000000000000000000000000000000",
	nonce: "0x0000000000000000",
	baseFeePerGas: "0x5f5e100",
	withdrawalsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	blobGasUsed: "0x0",
	excessBlobGas: "0x0",
	parentBeaconBlockRoot:
		"0x0000000000000000000000000000000000000000000000000000000000000000",
};

bench("BlockHeader.fromRpc - Cancun", () => {
	BlockHeader.fromRpc(rpcHeader);
});

await run();

// Pre-London (no baseFee)
const preLondonHeader = {
	parentHash:
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	sha3Uncles:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	miner: "0x742d35cc6634c0532925a3b844bc9e7595f0beb0",
	stateRoot:
		"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
	transactionsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	receiptsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	logsBloom: "0x" + "00".repeat(256),
	difficulty: "0x1000000",
	number: "0x100000",
	gasLimit: "0x1c9c380",
	gasUsed: "0x5208",
	timestamp: "0x60000000",
	extraData: "0x",
	mixHash:
		"0x0000000000000000000000000000000000000000000000000000000000000000",
	nonce: "0x0000000000000001",
};

bench("BlockHeader.fromRpc - pre-London", () => {
	BlockHeader.fromRpc(preLondonHeader);
});

await run();

// ============================================================================
// calculateHash Benchmarks
// ============================================================================

const parsedBlock = Block.fromRpc(rpcBlock);
const parsedHeader = BlockHeader.fromRpc(rpcHeader);

bench("Block.calculateHash", () => {
	Block.calculateHash(parsedBlock);
});

await run();

bench("BlockHeader.calculateHash", () => {
	BlockHeader.calculateHash(parsedHeader as BlockHeaderType);
});

await run();

// Pre-London header hash
const parsedPreLondonHeader = BlockHeader.fromRpc(preLondonHeader);

bench("BlockHeader.calculateHash - pre-London", () => {
	BlockHeader.calculateHash(parsedPreLondonHeader as BlockHeaderType);
});

await run();

// ============================================================================
// Combined Operations
// ============================================================================

bench("Block.fromRpc + calculateHash", () => {
	const block = Block.fromRpc(rpcBlock);
	Block.calculateHash(block);
});

await run();

// Multi-tx block (10 transactions)
const rpcBlockWith10Txs = {
	...rpcBlock,
	transactions: Array.from({ length: 10 }, (_, i) => ({
		type: "0x2",
		chainId: "0x1",
		nonce: `0x${i.toString(16)}`,
		maxPriorityFeePerGas: "0x3b9aca00",
		maxFeePerGas: "0x1bf08eb000",
		gas: "0x5208",
		to: "0x742d35cc6634c0532925a3b844bc9e7595f0beb0",
		value: "0xde0b6b3a7640000",
		input: "0x",
		accessList: [],
		v: "0x0",
		r: "0xb8c4f1c9b6b3a1c8d5e7f9a0b2c4d6e8f0a1b3c5d7e9f1a2b4c6d8e0f2a3b5c7",
		s: "0x0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1",
		hash: `0x${"a".repeat(62)}${i.toString(16).padStart(2, "0")}`,
		blockHash:
			"0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
		blockNumber: "0x1234567",
		transactionIndex: `0x${i.toString(16)}`,
		from: "0x1234567890123456789012345678901234567890",
		yParity: "0x0",
	})),
};

bench("Block.fromRpc - 10 transactions", () => {
	Block.fromRpc(rpcBlockWith10Txs);
});

await run();
