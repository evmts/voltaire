/**
 * Transaction Benchmarks: Voltaire TS vs WASM vs viem vs ethers
 *
 * Compares transaction operations across implementations.
 * Note: WASM currently only supports detectType. Full serialize/deserialize/hash in WASM is WIP.
 */

import { Transaction as EthersTransaction } from "ethers";
import { bench, run } from "mitata";
import {
	keccak256 as viemKeccak256,
	parseTransaction as viemParseTransaction,
	serializeTransaction as viemSerializeTransaction,
} from "viem";
import * as loader from "../../wasm-loader/loader.js";
import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { HashType } from "../Hash/HashType.js";
import * as Transaction from "./index.js";
import { detectTransactionType } from "./Transaction.wasm.js";
import { Type } from "./types.js";

// Initialize WASM
await loader.loadWasm(
	new URL("../../wasm-loader/primitives.wasm", import.meta.url),
);

// ============================================================================
// Test Data - Realistic signed EIP-1559 transaction
// ============================================================================

// Parse hex to Uint8Array
function hexToBytes(hex: string): Uint8Array {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(normalized.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

// Create branded address from hex
function createAddress(hex: string): BrandedAddress {
	const bytes = hexToBytes(hex);
	return bytes as BrandedAddress;
}

// Create branded hash from bytes
function _createHash(bytes: Uint8Array): HashType {
	return bytes as HashType;
}

// Real signed EIP-1559 transaction (mainnet transfer)
const signedEIP1559Hex =
	"0x02f8730180843b9aca00851bf08eb00082520894742d35cc6634c0532925a3b844bc9e7595f0beb0880de0b6b3a764000080c080a0b8c4f1c9b6b3a1c8d5e7f9a0b2c4d6e8f0a1b3c5d7e9f1a2b4c6d8e0f2a3b5c7a00d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1";

const signedTxBytes = hexToBytes(signedEIP1559Hex);

// Pre-create a transaction object for serialize benchmarks
const testAddress = createAddress("0x742d35cc6634c0532925a3b844bc9e7595f0beb0");
const testR = new Uint8Array(32);
testR.set(
	hexToBytes(
		"b8c4f1c9b6b3a1c8d5e7f9a0b2c4d6e8f0a1b3c5d7e9f1a2b4c6d8e0f2a3b5c7",
	),
);
const testS = new Uint8Array(32);
testS.set(
	hexToBytes("0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1"),
);

const eip1559Tx = {
	__tag: "TransactionEIP1559" as const,
	type: Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 1000000000n, // 1 gwei
	maxFeePerGas: 7500000000n, // 7.5 gwei
	gasLimit: 21000n,
	to: testAddress,
	value: 1000000000000000000n, // 1 ETH
	data: new Uint8Array(),
	accessList: [],
	yParity: 0,
	r: testR,
	s: testS,
};

// viem transaction format
const viemTx = {
	type: "eip1559" as const,
	chainId: 1,
	nonce: 0,
	maxPriorityFeePerGas: 1000000000n,
	maxFeePerGas: 7500000000n,
	gas: 21000n,
	to: "0x742d35cc6634c0532925a3b844bc9e7595f0beb0" as `0x${string}`,
	value: 1000000000000000000n,
	data: "0x" as `0x${string}`,
	accessList: [],
};

const viemSignature = {
	r: "0xb8c4f1c9b6b3a1c8d5e7f9a0b2c4d6e8f0a1b3c5d7e9f1a2b4c6d8e0f2a3b5c7" as `0x${string}`,
	s: "0x0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1" as `0x${string}`,
	yParity: 0,
};

// Pre-serialize for deserialize benchmarks
// biome-ignore lint/suspicious/noExplicitAny: benchmark flexibility
const serializedVoltaire = Transaction.serialize(eip1559Tx as any);
const serializedViem = viemSerializeTransaction(viemTx, viemSignature);

// ============================================================================
// Detect Type Benchmarks
// ============================================================================

bench("detectType - Voltaire TS", () => {
	Transaction.detectType(signedTxBytes);
});

bench("detectType - Voltaire WASM", () => {
	detectTransactionType(signedTxBytes);
});

// viem doesn't have explicit detectType - it's built into parseTransaction

await run();

// ============================================================================
// Serialize Benchmarks
// ============================================================================

bench("serialize - Voltaire TS", () => {
	// biome-ignore lint/suspicious/noExplicitAny: benchmark flexibility
	Transaction.serialize(eip1559Tx as any);
});

bench("serialize - viem", () => {
	viemSerializeTransaction(viemTx, viemSignature);
});

// ethers Transaction.from + serialized
const ethersTxObj = {
	type: 2,
	chainId: 1,
	nonce: 0,
	maxPriorityFeePerGas: 1000000000n,
	maxFeePerGas: 7500000000n,
	gasLimit: 21000n,
	to: "0x742d35cc6634c0532925a3b844bc9e7595f0beb0",
	value: 1000000000000000000n,
	data: "0x",
	accessList: [],
	signature: {
		r: "0xb8c4f1c9b6b3a1c8d5e7f9a0b2c4d6e8f0a1b3c5d7e9f1a2b4c6d8e0f2a3b5c7",
		s: "0x0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1",
		yParity: 0,
	},
};

bench("serialize - ethers", () => {
	EthersTransaction.from(ethersTxObj).serialized;
});

await run();

// ============================================================================
// Deserialize / Parse Benchmarks
// ============================================================================

bench("deserialize - Voltaire TS", () => {
	Transaction.deserialize(serializedVoltaire);
});

bench("parseTransaction - viem", () => {
	viemParseTransaction(serializedViem);
});

bench("parseTransaction - ethers", () => {
	EthersTransaction.from(serializedViem);
});

await run();

// ============================================================================
// Hash Benchmarks
// ============================================================================

bench("hash - Voltaire TS", () => {
	// biome-ignore lint/suspicious/noExplicitAny: benchmark flexibility
	Transaction.hash(eip1559Tx as any);
});

bench("hash - viem (keccak256 of serialized)", () => {
	viemKeccak256(serializedViem);
});

await run();

// ============================================================================
// Combined Round-trip Benchmarks
// ============================================================================

bench("roundtrip (serialize + deserialize) - Voltaire TS", () => {
	// biome-ignore lint/suspicious/noExplicitAny: benchmark flexibility
	const serialized = Transaction.serialize(eip1559Tx as any);
	Transaction.deserialize(serialized);
});

bench("roundtrip (serialize + parse) - viem", () => {
	const serialized = viemSerializeTransaction(viemTx, viemSignature);
	viemParseTransaction(serialized);
});

bench("roundtrip (serialize + parse) - ethers", () => {
	const tx = EthersTransaction.from(ethersTxObj);
	EthersTransaction.from(tx.serialized);
});

await run();

// ============================================================================
// Legacy Transaction Benchmarks
// ============================================================================

const legacyTx = {
	__tag: "TransactionLegacy" as const,
	type: Type.Legacy,
	nonce: 0n,
	gasPrice: 20000000000n, // 20 gwei
	gasLimit: 21000n,
	to: testAddress,
	value: 1000000000000000000n,
	data: new Uint8Array(),
	v: 27n,
	r: testR,
	s: testS,
};

const viemLegacyTx = {
	type: "legacy" as const,
	nonce: 0,
	gasPrice: 20000000000n,
	gas: 21000n,
	to: "0x742d35cc6634c0532925a3b844bc9e7595f0beb0" as `0x${string}`,
	value: 1000000000000000000n,
	data: "0x" as `0x${string}`,
};

const viemLegacySignature = {
	r: "0xb8c4f1c9b6b3a1c8d5e7f9a0b2c4d6e8f0a1b3c5d7e9f1a2b4c6d8e0f2a3b5c7" as `0x${string}`,
	s: "0x0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1" as `0x${string}`,
	v: 27n,
};

bench("serialize legacy - Voltaire TS", () => {
	// biome-ignore lint/suspicious/noExplicitAny: benchmark flexibility
	Transaction.serialize(legacyTx as any);
});

bench("serialize legacy - viem", () => {
	viemSerializeTransaction(viemLegacyTx, viemLegacySignature);
});

const ethersLegacyTx = {
	type: 0,
	nonce: 0,
	gasPrice: 20000000000n,
	gasLimit: 21000n,
	to: "0x742d35cc6634c0532925a3b844bc9e7595f0beb0",
	value: 1000000000000000000n,
	data: "0x",
	signature: {
		r: "0xb8c4f1c9b6b3a1c8d5e7f9a0b2c4d6e8f0a1b3c5d7e9f1a2b4c6d8e0f2a3b5c7",
		s: "0x0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1",
		v: 27,
	},
};

bench("serialize legacy - ethers", () => {
	EthersTransaction.from(ethersLegacyTx).serialized;
});

await run();

// ============================================================================
// EIP-2930 Transaction Benchmarks
// ============================================================================

const eip2930Tx = {
	__tag: "TransactionEIP2930" as const,
	type: Type.EIP2930,
	chainId: 1n,
	nonce: 0n,
	gasPrice: 20000000000n,
	gasLimit: 50000n,
	to: testAddress,
	value: 0n,
	data: new Uint8Array(),
	accessList: [
		{
			address: createAddress("0x0000000000000000000000000000000000000001"),
			storageKeys: [_createHash(new Uint8Array(32).fill(1))],
		},
	],
	yParity: 0,
	r: testR,
	s: testS,
};

const viemEIP2930Tx = {
	type: "eip2930" as const,
	chainId: 1,
	nonce: 0,
	gasPrice: 20000000000n,
	gas: 50000n,
	to: "0x742d35cc6634c0532925a3b844bc9e7595f0beb0" as `0x${string}`,
	value: 0n,
	data: "0x" as `0x${string}`,
	accessList: [
		{
			address: "0x0000000000000000000000000000000000000001" as `0x${string}`,
			storageKeys: [
				"0x0101010101010101010101010101010101010101010101010101010101010101" as `0x${string}`,
			],
		},
	],
};

bench("serialize EIP-2930 with accessList - Voltaire TS", () => {
	// biome-ignore lint/suspicious/noExplicitAny: benchmark flexibility
	Transaction.serialize(eip2930Tx as any);
});

bench("serialize EIP-2930 with accessList - viem", () => {
	viemSerializeTransaction(viemEIP2930Tx, viemSignature);
});

const ethersEIP2930Tx = {
	type: 1,
	chainId: 1,
	nonce: 0,
	gasPrice: 20000000000n,
	gasLimit: 50000n,
	to: "0x742d35cc6634c0532925a3b844bc9e7595f0beb0",
	value: 0n,
	data: "0x",
	accessList: [
		{
			address: "0x0000000000000000000000000000000000000001",
			storageKeys: [
				"0x0101010101010101010101010101010101010101010101010101010101010101",
			],
		},
	],
	signature: {
		r: "0xb8c4f1c9b6b3a1c8d5e7f9a0b2c4d6e8f0a1b3c5d7e9f1a2b4c6d8e0f2a3b5c7",
		s: "0x0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1",
		yParity: 0,
	},
};

bench("serialize EIP-2930 with accessList - ethers", () => {
	EthersTransaction.from(ethersEIP2930Tx).serialized;
});

await run();
