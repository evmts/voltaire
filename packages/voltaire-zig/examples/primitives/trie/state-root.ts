/**
 * State Root Computation
 *
 * Demonstrates using a Merkle Patricia Trie to compute Ethereum state root.
 * Each account address maps to its account state (nonce, balance, storage root, code hash).
 *
 * NOTE: This example shows the intended TypeScript API. Trie is currently implemented
 * in Zig only and not yet exposed to TypeScript through FFI bindings.
 */

import { Address, Bytes32, Hash } from "@tevm/voltaire";
import type { AddressType } from "@tevm/voltaire/Address";
import type { Bytes32Type } from "@tevm/voltaire/Bytes32";
import type { HashType } from "@tevm/voltaire/Hash";

// Conceptual Trie implementation for demonstration
class Trie {
	private data = new Map<string, Uint8Array>();

	put(key: AddressType, value: Uint8Array): void {
		const hex = Address.toHex(key);
		this.data.set(hex, value);
	}

	get(key: AddressType): Uint8Array | null {
		const hex = Address.toHex(key);
		return this.data.get(hex) || null;
	}

	rootHash(): HashType | null {
		if (this.data.size === 0) return null;
		return Hash.random();
	}
}

/** Simplified account state structure */
interface AccountState {
	nonce: bigint;
	balance: bigint;
	storageRoot: Bytes32Type;
	codeHash: Bytes32Type;
}

/** Encode account state to bytes (simplified - production uses RLP) */
function encodeAccountState(state: AccountState): Uint8Array {
	const buffer = new ArrayBuffer(8 + 16 + 32 + 32);
	const view = new DataView(buffer);

	// Nonce (8 bytes)
	view.setBigUint64(0, state.nonce, false);

	// Balance (16 bytes) - simplified
	view.setBigUint64(8, state.balance & 0xffffffffffffffffn, false);
	view.setBigUint64(16, state.balance >> 64n, false);

	// Storage root (32 bytes)
	const result = new Uint8Array(buffer);
	result.set(state.storageRoot, 24);

	// Code hash (32 bytes)
	result.set(state.codeHash, 56);

	return result;
}

// Create state trie
const stateTrie = new Trie();

// Account 1: EOA with balance
const addr1 = Address(0x12n);
const account1: AccountState = {
	nonce: 5n,
	balance: 1_000_000_000_000_000_000n, // 1 ETH in wei
	storageRoot: Bytes32.zero(), // Empty storage
	codeHash: Bytes32.zero(), // No code (EOA)
};

const encoded1 = encodeAccountState(account1);
stateTrie.put(addr1, encoded1);

// Account 2: Contract with storage
const addr2 = Address(0xabn);
const account2: AccountState = {
	nonce: 1n,
	balance: 500_000_000_000_000_000n, // 0.5 ETH
	storageRoot: Bytes32.fromHex(
		"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
	), // Has storage
	codeHash: Bytes32.fromHex(
		"0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
	), // Has code
};

const encoded2 = encodeAccountState(account2);
stateTrie.put(addr2, encoded2);

// Account 3: Another EOA
const addr3 = Address(0x34n);
const account3: AccountState = {
	nonce: 0n,
	balance: 2_500_000_000_000_000_000n, // 2.5 ETH
	storageRoot: Bytes32.zero(),
	codeHash: Bytes32.zero(),
};

const encoded3 = encodeAccountState(account3);
stateTrie.put(addr3, encoded3);

// Compute state root
const stateRoot = stateTrie.rootHash();

const account1Updated: AccountState = {
	...account1,
	nonce: 6n, // Nonce increased
};

const encoded1Updated = encodeAccountState(account1Updated);
stateTrie.put(addr1, encoded1Updated);

const newStateRoot = stateTrie.rootHash();

/**
 * Usage Pattern:
 *
 * The state trie maps account addresses (20 bytes) to RLP-encoded account state.
 * The root hash of this trie is stored in each block header, creating a
 * cryptographic commitment to the entire Ethereum world state.
 *
 * Any change to any account (balance, nonce, storage, code) changes the state root,
 * making it easy to verify that two nodes have the same state.
 */
