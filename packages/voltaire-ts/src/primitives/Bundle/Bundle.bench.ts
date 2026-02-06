/**
 * Bundle Module Benchmarks (Flashbots/MEV)
 *
 * Measures performance of transaction bundle operations
 */

import { bench, run } from "mitata";
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import type { BundleType } from "./BundleType.js";
import * as Bundle from "./index.js";

// ============================================================================
// Test Data - Realistic transaction bundles
// ============================================================================

// Create realistic signed transaction data
function createTransaction(seed: number, size: number): Uint8Array {
	const tx = new Uint8Array(size);
	// EIP-1559 transaction prefix
	tx[0] = 0x02;
	// Fill with deterministic data
	for (let i = 1; i < size; i++) {
		tx[i] = (seed + i * 13) % 256;
	}
	return tx;
}

// Small transaction (simple ETH transfer)
const smallTx = createTransaction(1, 110);

// Medium transaction (ERC20 transfer)
const mediumTx = createTransaction(2, 180);

// Large transaction (complex contract call)
const largeTx = createTransaction(3, 500);

// Very large transaction (batch multicall)
const veryLargeTx = createTransaction(4, 2000);

// Single transaction bundle
const singleTxBundle: BundleType = {
	transactions: [smallTx],
	blockNumber: 18000000n,
	minTimestamp: 1700000000n,
	maxTimestamp: 1700000060n,
};

// Small bundle (2 transactions - typical arbitrage)
const smallBundle: BundleType = {
	transactions: [smallTx, mediumTx],
	blockNumber: 18000000n,
	minTimestamp: 1700000000n,
	maxTimestamp: 1700000060n,
};

// Medium bundle (5 transactions - liquidation)
const mediumBundle: BundleType = {
	transactions: [smallTx, mediumTx, largeTx, smallTx, mediumTx],
	blockNumber: 18000000n,
	minTimestamp: 1700000000n,
	maxTimestamp: 1700000060n,
};

// Large bundle (10 transactions - complex MEV)
const largeBundle: BundleType = {
	transactions: Array.from({ length: 10 }, (_, i) =>
		createTransaction(i, 150 + i * 20),
	),
	blockNumber: 18000000n,
	minTimestamp: 1700000000n,
	maxTimestamp: 1700000060n,
};

// Very large bundle (20 transactions - batch operations)
const veryLargeBundle: BundleType = {
	transactions: Array.from({ length: 20 }, (_, i) =>
		createTransaction(i, 200 + i * 10),
	),
	blockNumber: 18000000n,
	minTimestamp: 1700000000n,
	maxTimestamp: 1700000060n,
};

// Bundle with large transactions
const largeTransactionsBundle: BundleType = {
	transactions: [veryLargeTx, veryLargeTx, veryLargeTx],
	blockNumber: 18000000n,
	minTimestamp: 1700000000n,
	maxTimestamp: 1700000060n,
};

// Crypto dependency
const crypto = { keccak256 };

// ============================================================================
// Benchmarks - Bundle.from
// ============================================================================

bench("Bundle.from - single tx - voltaire", () => {
	Bundle.from({
		transactions: [smallTx],
		blockNumber: 18000000n,
	});
});

bench("Bundle.from - small bundle - voltaire", () => {
	Bundle.from({
		transactions: [smallTx, mediumTx],
		blockNumber: 18000000n,
		minTimestamp: 1700000000n,
		maxTimestamp: 1700000060n,
	});
});

bench("Bundle.from - medium bundle - voltaire", () => {
	Bundle.from({
		transactions: [smallTx, mediumTx, largeTx, smallTx, mediumTx],
		blockNumber: 18000000n,
		minTimestamp: 1700000000n,
		maxTimestamp: 1700000060n,
	});
});

bench("Bundle.from - large bundle - voltaire", () => {
	Bundle.from({
		transactions: Array.from({ length: 10 }, (_, i) =>
			createTransaction(i, 150),
		),
		blockNumber: 18000000n,
	});
});

await run();

// ============================================================================
// Benchmarks - Bundle.toHash
// ============================================================================

bench("Bundle.toHash - single tx - voltaire", () => {
	Bundle.toHash(singleTxBundle, crypto);
});

bench("Bundle.toHash - small bundle - voltaire", () => {
	Bundle.toHash(smallBundle, crypto);
});

bench("Bundle.toHash - medium bundle - voltaire", () => {
	Bundle.toHash(mediumBundle, crypto);
});

bench("Bundle.toHash - large bundle - voltaire", () => {
	Bundle.toHash(largeBundle, crypto);
});

bench("Bundle.toHash - very large bundle - voltaire", () => {
	Bundle.toHash(veryLargeBundle, crypto);
});

bench("Bundle.toHash - large transactions - voltaire", () => {
	Bundle.toHash(largeTransactionsBundle, crypto);
});

await run();

// ============================================================================
// Benchmarks - Bundle.size
// ============================================================================

bench("Bundle.size - single tx - voltaire", () => {
	Bundle.size(singleTxBundle);
});

bench("Bundle.size - small bundle - voltaire", () => {
	Bundle.size(smallBundle);
});

bench("Bundle.size - medium bundle - voltaire", () => {
	Bundle.size(mediumBundle);
});

bench("Bundle.size - large bundle - voltaire", () => {
	Bundle.size(largeBundle);
});

bench("Bundle.size - very large bundle - voltaire", () => {
	Bundle.size(veryLargeBundle);
});

await run();

// ============================================================================
// Benchmarks - Bundle.addTransaction
// ============================================================================

bench("Bundle.addTransaction - to empty - voltaire", () => {
	const emptyBundle: BundleType = {
		transactions: [],
		blockNumber: 18000000n,
	};
	Bundle.addTransaction(emptyBundle, smallTx);
});

bench("Bundle.addTransaction - to small bundle - voltaire", () => {
	Bundle.addTransaction(smallBundle, largeTx);
});

bench("Bundle.addTransaction - to large bundle - voltaire", () => {
	Bundle.addTransaction(largeBundle, largeTx);
});

await run();

// ============================================================================
// Benchmarks - Bundle.toFlashbotsParams
// ============================================================================

bench("Bundle.toFlashbotsParams - single tx - voltaire", () => {
	Bundle.toFlashbotsParams(singleTxBundle);
});

bench("Bundle.toFlashbotsParams - small bundle - voltaire", () => {
	Bundle.toFlashbotsParams(smallBundle);
});

bench("Bundle.toFlashbotsParams - medium bundle - voltaire", () => {
	Bundle.toFlashbotsParams(mediumBundle);
});

bench("Bundle.toFlashbotsParams - large bundle - voltaire", () => {
	Bundle.toFlashbotsParams(largeBundle);
});

await run();

// ============================================================================
// Benchmarks - Batch Operations
// ============================================================================

bench("Bundle.toHash x10 - voltaire", () => {
	for (let i = 0; i < 10; i++) {
		Bundle.toHash(smallBundle, crypto);
	}
});

bench("Bundle.addTransaction x10 - voltaire", () => {
	let bundle = singleTxBundle;
	for (let i = 0; i < 10; i++) {
		bundle = Bundle.addTransaction(bundle, createTransaction(i + 100, 150));
	}
});

await run();

// ============================================================================
// Benchmarks - Complete Workflow
// ============================================================================

bench("Bundle full workflow - create, add, hash - voltaire", () => {
	// Create bundle
	const bundle = Bundle.from({
		transactions: [smallTx],
		blockNumber: 18000000n,
	});
	// Add transactions
	const bundle2 = Bundle.addTransaction(bundle, mediumTx);
	const bundle3 = Bundle.addTransaction(bundle2, largeTx);
	// Hash
	Bundle.toHash(bundle3, crypto);
	// Get params
	Bundle.toFlashbotsParams(bundle3);
});

await run();
