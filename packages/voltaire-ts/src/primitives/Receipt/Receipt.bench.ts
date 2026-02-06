/**
 * Receipt Benchmarks: Voltaire TS
 *
 * Compares receipt operations - from, assertValid, isPreByzantium.
 */

import { bench, run } from "mitata";
import type { AddressType } from "../Address/AddressType.js";
import type { BlockHashType } from "../BlockHash/BlockHashType.js";
import type { BlockNumberType } from "../BlockNumber/BlockNumberType.js";
import type { TransactionHashType } from "../TransactionHash/TransactionHashType.js";
import type { TransactionIndexType } from "../TransactionIndex/TransactionIndexType.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";
import * as Receipt from "./index.js";

// ============================================================================
// Test Data - Realistic receipt data
// ============================================================================

// Helper to create typed test data
function createHash(fill: number): TransactionHashType {
	const arr = new Uint8Array(32);
	arr.fill(fill);
	return arr as TransactionHashType;
}

function createBlockHash(fill: number): BlockHashType {
	const arr = new Uint8Array(32);
	arr.fill(fill);
	return arr as BlockHashType;
}

function createAddress(fill: number): AddressType {
	const arr = new Uint8Array(20);
	arr.fill(fill);
	return arr as AddressType;
}

function createUint256(value: bigint): Uint256Type {
	const arr = new Uint8Array(32);
	let remaining = value;
	for (let i = 31; i >= 0 && remaining > 0n; i--) {
		arr[i] = Number(remaining & 0xffn);
		remaining >>= 8n;
	}
	return arr as Uint256Type;
}

// Post-Byzantium receipt (has status)
const postByzantiumReceipt = {
	transactionHash: createHash(0xaa),
	transactionIndex: 0 as unknown as TransactionIndexType,
	blockHash: createBlockHash(0xbb),
	blockNumber: 1000000n as unknown as BlockNumberType,
	from: createAddress(0x11),
	to: createAddress(0x22),
	cumulativeGasUsed: createUint256(21000n),
	gasUsed: createUint256(21000n),
	contractAddress: null,
	logs: [],
	logsBloom: new Uint8Array(256),
	status: 1,
	effectiveGasPrice: createUint256(1000000000n),
	type: "eip1559" as const,
};

// Pre-Byzantium receipt (has root instead of status)
// Note: Receipt.from requires status, so we test assertValid with pre-Byzantium
const preByzantiumReceiptForValidation = {
	transactionHash: createHash(0xcc),
	transactionIndex: 5 as unknown as TransactionIndexType,
	blockHash: createBlockHash(0xdd),
	blockNumber: 100000n as unknown as BlockNumberType,
	from: createAddress(0x33),
	to: createAddress(0x44),
	cumulativeGasUsed: createUint256(42000n),
	gasUsed: createUint256(21000n),
	contractAddress: null,
	logs: [],
	logsBloom: new Uint8Array(256),
	root: createHash(0xee),
	effectiveGasPrice: createUint256(20000000000n),
	type: "legacy" as const,
};

// Legacy receipt for from() tests
const legacyReceipt = {
	transactionHash: createHash(0xcc),
	transactionIndex: 5 as unknown as TransactionIndexType,
	blockHash: createBlockHash(0xdd),
	blockNumber: 100000n as unknown as BlockNumberType,
	from: createAddress(0x33),
	to: createAddress(0x44),
	cumulativeGasUsed: createUint256(42000n),
	gasUsed: createUint256(21000n),
	contractAddress: null,
	logs: [],
	logsBloom: new Uint8Array(256),
	status: 1,
	effectiveGasPrice: createUint256(20000000000n),
	type: "legacy" as const,
};

// Contract creation receipt
const contractCreationReceipt = {
	transactionHash: createHash(0xff),
	transactionIndex: 0 as unknown as TransactionIndexType,
	blockHash: createBlockHash(0x11),
	blockNumber: 2000000n as unknown as BlockNumberType,
	from: createAddress(0x55),
	to: null,
	cumulativeGasUsed: createUint256(500000n),
	gasUsed: createUint256(500000n),
	contractAddress: createAddress(0x66),
	logs: [],
	logsBloom: new Uint8Array(256),
	status: 1,
	effectiveGasPrice: createUint256(50000000000n),
	type: "eip1559" as const,
};

// Receipt with logs
const receiptWithLogs = {
	...postByzantiumReceipt,
	logs: Array.from({ length: 5 }, (_, i) => ({
		address: createAddress(0x77 + i),
		topics: [createHash(0x88 + i)],
		data: new Uint8Array(64),
		blockNumber: 1000000n,
		transactionHash: createHash(0xaa),
		transactionIndex: 0,
		blockHash: createBlockHash(0xbb),
		logIndex: i,
		removed: false,
	})),
};

// EIP-4844 blob receipt
const blobReceipt = {
	...postByzantiumReceipt,
	type: "eip4844" as const,
	blobGasUsed: createUint256(131072n),
	blobGasPrice: createUint256(1000000n),
};

// ============================================================================
// from Benchmarks
// ============================================================================

bench("Receipt.from - post-Byzantium (EIP-1559)", () => {
	Receipt.from(postByzantiumReceipt);
});

await run();

bench("Receipt.from - legacy", () => {
	Receipt.from(legacyReceipt);
});

await run();

bench("Receipt.from - contract creation", () => {
	Receipt.from(contractCreationReceipt);
});

await run();

bench("Receipt.from - with 5 logs", () => {
	Receipt.from(receiptWithLogs);
});

await run();

bench("Receipt.from - EIP-4844 blob", () => {
	Receipt.from(blobReceipt);
});

await run();

// ============================================================================
// assertValid Benchmarks
// ============================================================================

// biome-ignore lint/suspicious/noExplicitAny: benchmark data
const validPostByzantium = Receipt.from(postByzantiumReceipt) as any;
// Create pre-Byzantium receipt directly (bypasses from() validation)
// biome-ignore lint/suspicious/noExplicitAny: benchmark data
const validPreByzantium = preByzantiumReceiptForValidation as any;

bench("Receipt.assertValid - post-Byzantium", () => {
	Receipt.assertValid(validPostByzantium);
});

await run();

bench("Receipt.assertValid - pre-Byzantium", () => {
	Receipt.assertValid(validPreByzantium);
});

await run();

// ============================================================================
// isPreByzantium Benchmarks
// ============================================================================

bench("Receipt.isPreByzantium - post-Byzantium (false)", () => {
	Receipt.isPreByzantium(validPostByzantium);
});

await run();

bench("Receipt.isPreByzantium - pre-Byzantium (true)", () => {
	Receipt.isPreByzantium(validPreByzantium);
});

await run();

// ============================================================================
// Combined Operations
// ============================================================================

bench("Receipt.from + assertValid + isPreByzantium", () => {
	// biome-ignore lint/suspicious/noExplicitAny: benchmark data
	const receipt = Receipt.from(postByzantiumReceipt) as any;
	Receipt.assertValid(receipt);
	Receipt.isPreByzantium(receipt);
});

await run();
