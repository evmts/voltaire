/**
 * AccountState Module Benchmarks
 *
 * Measures performance of Ethereum account state operations
 * Note: Run with vitest bench or the full bench suite due to module resolution
 */

import { bench, run } from "mitata";
import { from } from "./from.js";
import { equals } from "./equals.js";
import type { AccountStateType } from "./AccountStateType.js";

// ============================================================================
// Test Data - Realistic account states
// ============================================================================

function createHash(seed: number): Uint8Array {
	const hash = new Uint8Array(32);
	for (let i = 0; i < 32; i++) {
		hash[i] = (seed + i * 7) % 256;
	}
	return hash;
}

// Simulated empty hashes
const EMPTY_TRIE_HASH_BYTES = createHash(0x56);
const EMPTY_CODE_HASH_BYTES = createHash(0xc5);

// EOA (Externally Owned Account) - most common
const eoaState = from({
	nonce: 42n,
	balance: 1000000000000000000n, // 1 ETH
	storageRoot: EMPTY_TRIE_HASH_BYTES,
	codeHash: EMPTY_CODE_HASH_BYTES,
});

// Contract account with storage
const contractState = from({
	nonce: 1n,
	balance: 500000000000000000n, // 0.5 ETH
	storageRoot: createHash(100),
	codeHash: createHash(200),
});

// Empty account (fresh)
const emptyState = from({
	nonce: 0n,
	balance: 0n,
	storageRoot: EMPTY_TRIE_HASH_BYTES,
	codeHash: EMPTY_CODE_HASH_BYTES,
});

// High balance account (whale)
const whaleState = from({
	nonce: 1000n,
	balance: 1000000000000000000000000n, // 1M ETH
	storageRoot: EMPTY_TRIE_HASH_BYTES,
	codeHash: EMPTY_CODE_HASH_BYTES,
});

// High nonce account (old, active)
const highNonceState = from({
	nonce: 0xffffffffffffffffn, // Max nonce
	balance: 100000000000000000n,
	storageRoot: EMPTY_TRIE_HASH_BYTES,
	codeHash: EMPTY_CODE_HASH_BYTES,
});

// Complex contract (Uniswap-like)
const complexContractState = from({
	nonce: 1n,
	balance: 10000000000000000000000n, // 10k ETH
	storageRoot: createHash(300),
	codeHash: createHash(400),
});

// ============================================================================
// Benchmarks - AccountState.from
// ============================================================================

bench("AccountState.from - EOA - voltaire", () => {
	from({
		nonce: 42n,
		balance: 1000000000000000000n,
		storageRoot: EMPTY_TRIE_HASH_BYTES,
		codeHash: EMPTY_CODE_HASH_BYTES,
	});
});

bench("AccountState.from - contract - voltaire", () => {
	from({
		nonce: 1n,
		balance: 500000000000000000n,
		storageRoot: createHash(100),
		codeHash: createHash(200),
	});
});

bench("AccountState.from - empty - voltaire", () => {
	from({
		nonce: 0n,
		balance: 0n,
		storageRoot: EMPTY_TRIE_HASH_BYTES,
		codeHash: EMPTY_CODE_HASH_BYTES,
	});
});

bench("AccountState.from - whale - voltaire", () => {
	from({
		nonce: 1000n,
		balance: 1000000000000000000000000n,
		storageRoot: EMPTY_TRIE_HASH_BYTES,
		codeHash: EMPTY_CODE_HASH_BYTES,
	});
});

await run();

// ============================================================================
// Benchmarks - AccountState.equals
// ============================================================================

bench("AccountState.equals - same reference - voltaire", () => {
	equals(eoaState, eoaState);
});

bench("AccountState.equals - equal EOAs - voltaire", () => {
	const eoa2 = from({
		nonce: 42n,
		balance: 1000000000000000000n,
		storageRoot: EMPTY_TRIE_HASH_BYTES,
		codeHash: EMPTY_CODE_HASH_BYTES,
	});
	equals(eoaState, eoa2);
});

bench("AccountState.equals - different nonce - voltaire", () => {
	const eoa2 = from({
		nonce: 43n,
		balance: 1000000000000000000n,
		storageRoot: EMPTY_TRIE_HASH_BYTES,
		codeHash: EMPTY_CODE_HASH_BYTES,
	});
	equals(eoaState, eoa2);
});

bench("AccountState.equals - different balance - voltaire", () => {
	const eoa2 = from({
		nonce: 42n,
		balance: 2000000000000000000n,
		storageRoot: EMPTY_TRIE_HASH_BYTES,
		codeHash: EMPTY_CODE_HASH_BYTES,
	});
	equals(eoaState, eoa2);
});

bench("AccountState.equals - EOA vs contract - voltaire", () => {
	equals(eoaState, contractState);
});

bench("AccountState.equals - contracts with different storage - voltaire", () => {
	const contract2 = from({
		nonce: 1n,
		balance: 500000000000000000n,
		storageRoot: createHash(101),
		codeHash: createHash(200),
	});
	equals(contractState, contract2);
});

await run();

// ============================================================================
// Benchmarks - Batch Operations
// ============================================================================

bench("AccountState.from x10 - voltaire", () => {
	for (let i = 0; i < 10; i++) {
		from({
			nonce: BigInt(i),
			balance: BigInt(i) * 1000000000000000000n,
			storageRoot: EMPTY_TRIE_HASH_BYTES,
			codeHash: EMPTY_CODE_HASH_BYTES,
		});
	}
});

bench("AccountState.equals x10 - voltaire", () => {
	const states = [
		eoaState,
		contractState,
		emptyState,
		whaleState,
		complexContractState,
		eoaState,
		contractState,
		emptyState,
		whaleState,
		complexContractState,
	];
	for (let i = 0; i < states.length - 1; i++) {
		equals(states[i], states[i + 1]);
	}
});

await run();

// ============================================================================
// Benchmarks - Full Workflow
// ============================================================================

bench("AccountState workflow - create and compare - voltaire", () => {
	// Create a new account state
	const state = from({
		nonce: 5n,
		balance: 100000000000000000n,
		storageRoot: EMPTY_TRIE_HASH_BYTES,
		codeHash: EMPTY_CODE_HASH_BYTES,
	});
	// Compare with another state
	equals(state, eoaState);
});

await run();

// ============================================================================
// Benchmarks - Edge Cases
// ============================================================================

bench("AccountState.from - max nonce - voltaire", () => {
	from({
		nonce: 0xffffffffffffffffn,
		balance: 0n,
		storageRoot: EMPTY_TRIE_HASH_BYTES,
		codeHash: EMPTY_CODE_HASH_BYTES,
	});
});

bench("AccountState.from - max balance - voltaire", () => {
	from({
		nonce: 0n,
		balance: 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
		storageRoot: EMPTY_TRIE_HASH_BYTES,
		codeHash: EMPTY_CODE_HASH_BYTES,
	});
});

bench("AccountState.equals - high nonce accounts - voltaire", () => {
	equals(highNonceState, highNonceState);
});

await run();
