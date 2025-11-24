import * as Address from "../../../primitives/Address/index.js";
import * as BlockHash from "../../../primitives/BlockHash/index.js";
import * as BlockNumber from "../../../primitives/BlockNumber/index.js";
import * as Receipt from "../../../primitives/Receipt/index.js";
import * as TransactionHash from "../../../primitives/TransactionHash/index.js";
import * as TransactionIndex from "../../../primitives/TransactionIndex/index.js";
import * as TransactionStatus from "../../../primitives/TransactionStatus/index.js";
import type { Uint256Type } from "../../../primitives/Uint/Uint256Type.js";

// Example: Logs bloom filter

// Create a logs bloom filter (256 bytes)
// In practice, this would be computed from the event logs
const logsBloom = new Uint8Array(256);

// Simulate bloom filter with some data
// Real bloom filters use hash functions to set specific bits
logsBloom[10] = 0b10101010;
logsBloom[50] = 0b01010101;
logsBloom[100] = 0b11001100;
logsBloom[200] = 0b00110011;

const receiptWithBloom = Receipt.from({
	transactionHash: TransactionHash.fromHex(
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	),
	transactionIndex: TransactionIndex.from(5),
	blockHash: BlockHash.fromHex(
		"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
	),
	blockNumber: BlockNumber.from(15537394n),
	from: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"),
	to: Address.fromHex("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
	cumulativeGasUsed: 456789n as Uint256Type,
	gasUsed: 65000n as Uint256Type,
	contractAddress: null,
	logs: [],
	logsBloom: logsBloom,
	status: TransactionStatus.success(65000n as Uint256Type),
	effectiveGasPrice: 25000000000n as Uint256Type,
	type: "eip1559",
});

// Count set bits (approximation of event density)
let setBits = 0;
for (const byte of receiptWithBloom.logsBloom) {
	let n = byte;
	while (n > 0) {
		setBits += n & 1;
		n >>= 1;
	}
}

// Empty bloom filter (no events)
const emptyBloom = new Uint8Array(256);
const receiptNoEvents = Receipt.from({
	transactionHash: TransactionHash.fromHex(
		"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
	),
	transactionIndex: TransactionIndex.from(0),
	blockHash: BlockHash.fromHex(
		"0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
	),
	blockNumber: BlockNumber.from(15537395n),
	from: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"),
	to: Address.fromHex("0x1a2b3c4d5e6f7890abcdef1234567890abcdef12"),
	cumulativeGasUsed: 21000n as Uint256Type,
	gasUsed: 21000n as Uint256Type,
	contractAddress: null,
	logs: [],
	logsBloom: emptyBloom,
	status: TransactionStatus.success(21000n as Uint256Type),
	effectiveGasPrice: 30000000000n as Uint256Type,
	type: "eip1559",
});
const allZeros = receiptNoEvents.logsBloom.every((byte) => byte === 0);

// Dense bloom filter (many events)
const denseBloom = new Uint8Array(256);
for (let i = 0; i < denseBloom.length; i += 4) {
	denseBloom[i] = 0xff;
}

const receiptManyEvents = Receipt.from({
	transactionHash: TransactionHash.fromHex(
		"0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
	),
	transactionIndex: TransactionIndex.from(10),
	blockHash: BlockHash.fromHex(
		"0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
	),
	blockNumber: BlockNumber.from(15537396n),
	from: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"),
	to: Address.fromHex("0x7a250d5630b4cf539739df2c5dacb4c659f2488d"),
	cumulativeGasUsed: 3000000n as Uint256Type,
	gasUsed: 500000n as Uint256Type,
	contractAddress: null,
	logs: [],
	logsBloom: denseBloom,
	status: TransactionStatus.success(500000n as Uint256Type),
	effectiveGasPrice: 35000000000n as Uint256Type,
	type: "eip1559",
});
let denseBits = 0;
for (const byte of receiptManyEvents.logsBloom) {
	let n = byte;
	while (n > 0) {
		denseBits += n & 1;
		n >>= 1;
	}
}
