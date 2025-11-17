/**
 * Transaction Benchmarks
 *
 * Measures performance of transaction operations
 */

import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { HashType } from "../Hash/index.js";
import type { BrandedTransactionEIP1559 } from "../Transaction/EIP1559/TransactionEIP1559Type.js";
import type { TransactionEIP4844Type } from "../Transaction/EIP4844/TransactionEIP4844Type.js";
import type { TransactionEIP7702Type } from "../Transaction/EIP7702/TransactionEIP7702Type.js";
import type { TransactionLegacyType } from "../Transaction/Legacy/TransactionLegacyType.js";
import * as Transaction from "../Transaction/index.js";
import type {
	EIP1559,
	EIP2930,
	EIP4844,
	EIP7702,
	Legacy,
} from "../Transaction/types.js";

// ============================================================================
// Benchmark Runner
// ============================================================================

interface BenchmarkResult {
	name: string;
	opsPerSec: number;
	avgTimeMs: number;
	iterations: number;
}

function benchmark(
	name: string,
	fn: () => void,
	duration = 2000,
): BenchmarkResult {
	// Warmup
	for (let i = 0; i < 100; i++) {
		try {
			fn();
		} catch {
			// Ignore errors during warmup
		}
	}

	// Benchmark
	const startTime = performance.now();
	let iterations = 0;
	let endTime = startTime;

	while (endTime - startTime < duration) {
		try {
			fn();
		} catch {
			// Count iteration even if it throws
		}
		iterations++;
		endTime = performance.now();
	}

	const totalTime = endTime - startTime;
	const avgTimeMs = totalTime / iterations;
	const opsPerSec = (iterations / totalTime) * 1000;

	return {
		name,
		opsPerSec,
		avgTimeMs,
		iterations,
	};
}

// ============================================================================
// Test Data
// ============================================================================

function createAddress(byte: number): BrandedAddress {
	const addr = new Uint8Array(20);
	addr.fill(byte);
	return addr as BrandedAddress;
}

function createHash(byte: number): HashType {
	const hash = new Uint8Array(32);
	hash.fill(byte);
	return hash as HashType;
}

function createBytes(length: number, fill = 0): Uint8Array {
	const bytes = new Uint8Array(length);
	bytes.fill(fill);
	return bytes;
}

const testAddress = createAddress(1);
const testHash = createHash(10);
const testSignature = {
	r: createBytes(32, 1),
	s: createBytes(32, 2),
};

const legacyTx: Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20000000000n,
	gasLimit: 21000n,
	to: testAddress,
	value: 1000000000000000000n,
	data: new Uint8Array(),
	v: 27n,
	r: testSignature.r,
	s: testSignature.s,
};

const eip155Tx: Legacy = {
	...legacyTx,
	v: 37n, // Chain ID 1
};

const eip2930Tx: EIP2930 = {
	type: Transaction.Type.EIP2930,
	chainId: 1n,
	nonce: 0n,
	gasPrice: 20000000000n,
	gasLimit: 21000n,
	to: testAddress,
	value: 1000000000000000000n,
	data: new Uint8Array(),
	accessList: [{ address: testAddress, storageKeys: [testHash] }],
	yParity: 0,
	r: testSignature.r,
	s: testSignature.s,
};

const eip1559Tx: EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2000000000n,
	maxFeePerGas: 30000000000n,
	gasLimit: 21000n,
	to: testAddress,
	value: 1000000000000000000n,
	data: new Uint8Array(),
	accessList: [{ address: testAddress, storageKeys: [testHash] }],
	yParity: 0,
	r: testSignature.r,
	s: testSignature.s,
};

const eip4844Tx: EIP4844 = {
	type: Transaction.Type.EIP4844,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 1000000000n,
	maxFeePerGas: 20000000000n,
	gasLimit: 100000n,
	to: testAddress,
	value: 0n,
	data: new Uint8Array(),
	accessList: [],
	maxFeePerBlobGas: 2000000000n,
	blobVersionedHashes: [testHash, createHash(20)],
	yParity: 0,
	r: testSignature.r,
	s: testSignature.s,
};

const eip7702Tx: EIP7702 = {
	type: Transaction.Type.EIP7702,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 1000000000n,
	maxFeePerGas: 20000000000n,
	gasLimit: 100000n,
	to: testAddress,
	value: 0n,
	data: new Uint8Array(),
	accessList: [],
	authorizationList: [],
	yParity: 0,
	r: testSignature.r,
	s: testSignature.s,
};

const typedTxData = new Uint8Array([0x02, 0xc0]);
const legacyTxData = new Uint8Array([0xc0]);

const results: BenchmarkResult[] = [];
results.push(
	benchmark("Transaction.isLegacy", () => Transaction.isLegacy(legacyTx)),
);
results.push(
	benchmark("Transaction.isEIP2930", () => Transaction.isEIP2930(eip2930Tx)),
);
results.push(
	benchmark("Transaction.isEIP1559", () => Transaction.isEIP1559(eip1559Tx)),
);
results.push(
	benchmark("Transaction.isEIP4844", () => Transaction.isEIP4844(eip4844Tx)),
);
results.push(
	benchmark("Transaction.isEIP7702", () => Transaction.isEIP7702(eip7702Tx)),
);
results.push(
	benchmark("Transaction.detectType - typed tx", () =>
		Transaction.detectType(typedTxData),
	),
);
results.push(
	benchmark("Transaction.detectType - legacy tx", () =>
		Transaction.detectType(legacyTxData),
	),
);
results.push(
	benchmark("Legacy.getChainId - EIP-155", () =>
		Transaction.Legacy.getChainId.call(eip155Tx as TransactionLegacyType),
	),
);
results.push(
	benchmark("Legacy.getChainId - pre-EIP-155", () =>
		Transaction.Legacy.getChainId.call(legacyTx as TransactionLegacyType),
	),
);
results.push(
	benchmark("Legacy.serialize", () => {
		try {
			Transaction.Legacy.serialize.call(legacyTx as TransactionLegacyType);
		} catch {}
	}),
);
results.push(
	benchmark("Legacy.hash", () => {
		try {
			Transaction.Legacy.hash.call(legacyTx as TransactionLegacyType);
		} catch {}
	}),
);
results.push(
	benchmark("Legacy.getSigningHash", () => {
		try {
			Transaction.Legacy.getSigningHash.call(legacyTx as TransactionLegacyType);
		} catch {}
	}),
);
const baseFee = 10000000000n;
results.push(
	benchmark("EIP1559.getEffectiveGasPrice", () =>
		Transaction.EIP1559.getEffectiveGasPrice(
			eip1559Tx as BrandedTransactionEIP1559,
			baseFee,
		),
	),
);
results.push(
	benchmark("EIP1559.serialize", () => {
		try {
			Transaction.EIP1559.serialize(eip1559Tx as BrandedTransactionEIP1559);
		} catch {}
	}),
);
results.push(
	benchmark("EIP1559.hash", () => {
		try {
			Transaction.EIP1559.hash(eip1559Tx as BrandedTransactionEIP1559);
		} catch {}
	}),
);
results.push(
	benchmark("EIP1559.getSigningHash", () => {
		try {
			Transaction.EIP1559.getSigningHash(
				eip1559Tx as BrandedTransactionEIP1559,
			);
		} catch {}
	}),
);
const blobBaseFee = 1n;
results.push(
	benchmark("EIP4844.getBlobGasCost", () =>
		Transaction.EIP4844.getBlobGasCost(
			eip4844Tx as TransactionEIP4844Type,
			blobBaseFee,
		),
	),
);
results.push(
	benchmark("EIP4844.getEffectiveGasPrice", () =>
		Transaction.EIP4844.getEffectiveGasPrice(
			eip4844Tx as TransactionEIP4844Type,
			baseFee,
		),
	),
);
results.push(
	benchmark("EIP4844.serialize", () => {
		try {
			Transaction.EIP4844.serialize(eip4844Tx as TransactionEIP4844Type);
		} catch {}
	}),
);
results.push(
	benchmark("EIP7702.getEffectiveGasPrice", () =>
		Transaction.EIP7702.getEffectiveGasPrice(
			eip7702Tx as TransactionEIP7702Type,
			baseFee,
		),
	),
);
results.push(
	benchmark("Transaction.format - legacy", () => Transaction.format(legacyTx)),
);
results.push(
	benchmark("Transaction.format - EIP-1559", () =>
		Transaction.format(eip1559Tx),
	),
);
results.push(
	benchmark("Transaction.getGasPrice - legacy", () =>
		Transaction.getGasPrice(legacyTx),
	),
);
results.push(
	benchmark("Transaction.getGasPrice - EIP-1559", () =>
		Transaction.getGasPrice(eip1559Tx, baseFee),
	),
);
results.push(
	benchmark("Transaction.hasAccessList", () =>
		Transaction.hasAccessList(legacyTx),
	),
);
results.push(
	benchmark("Transaction.getAccessList", () =>
		Transaction.getAccessList(eip1559Tx),
	),
);
results.push(
	benchmark("Transaction.getChainId", () => Transaction.getChainId(eip1559Tx)),
);
results.push(
	benchmark("Transaction.isSigned", () => Transaction.isSigned(legacyTx)),
);
results.push(
	benchmark("Create Legacy Transaction", () => {
		const tx: Legacy = {
			type: Transaction.Type.Legacy,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: testAddress,
			value: 1000000000000000000n,
			data: new Uint8Array(),
			v: 27n,
			r: testSignature.r,
			s: testSignature.s,
		};
		return tx;
	}),
);
results.push(
	benchmark("Create EIP-1559 Transaction", () => {
		const tx: EIP1559 = {
			type: Transaction.Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 2000000000n,
			maxFeePerGas: 30000000000n,
			gasLimit: 21000n,
			to: testAddress,
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: testSignature.r,
			s: testSignature.s,
		};
		return tx;
	}),
);
results.push(
	benchmark("Create EIP-4844 Transaction", () => {
		const tx: EIP4844 = {
			type: Transaction.Type.EIP4844,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 100000n,
			to: testAddress,
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			maxFeePerBlobGas: 2000000000n,
			blobVersionedHashes: [testHash],
			yParity: 0,
			r: testSignature.r,
			s: testSignature.s,
		};
		return tx;
	}),
);
results.push(benchmark("Access nonce", () => legacyTx.nonce));
results.push(benchmark("Access gasPrice", () => legacyTx.gasPrice));
results.push(benchmark("Access to address", () => legacyTx.to));
results.push(benchmark("Access value", () => legacyTx.value));
results.push(benchmark("Access data", () => legacyTx.data));
results.push(benchmark("Access signature (r)", () => legacyTx.r));

const sorted = [...results].sort((a, b) => b.opsPerSec - a.opsPerSec);
sorted.slice(0, 5).forEach((_r, _i) => {});

// Export results for analysis
if (typeof Bun !== "undefined") {
	const resultsFile =
		"/Users/williamcory/primitives/src/primitives/transaction-results.json";
	await Bun.write(resultsFile, JSON.stringify(results, null, 2));
}
