/**
 * Transaction Trie
 *
 * Demonstrates building a transaction trie for a block. In Ethereum, each block
 * contains a trie of transactions ordered by their index in the block.
 *
 * NOTE: This example shows the intended TypeScript API. Trie is currently implemented
 * in Zig only and not yet exposed to TypeScript through FFI bindings.
 */

import { Address, Bytes, Hash } from "@tevm/voltaire";
import type { AddressType } from "@tevm/voltaire/Address";
import type { BytesType } from "@tevm/voltaire/Bytes";
import type { HashType } from "@tevm/voltaire/Hash";

// Conceptual Trie implementation for demonstration
class Trie {
	private data = new Map<string, BytesType>();

	put(key: BytesType, value: BytesType): void {
		const hex = Bytes.toHex(key);
		this.data.set(hex, value);
	}

	get(key: BytesType): BytesType | null {
		const hex = Bytes.toHex(key);
		return this.data.get(hex) || null;
	}

	rootHash(): HashType | null {
		if (this.data.size === 0) return null;
		return Hash.random();
	}
}

/** Simplified transaction representation */
interface Transaction {
	from: AddressType;
	to: AddressType;
	value: bigint;
	nonce: bigint;
	gasLimit: bigint;
}

/** Encode transaction to bytes (simplified - production uses RLP) */
function encodeTransaction(tx: Transaction): BytesType {
	const buffer = new ArrayBuffer(20 + 20 + 16 + 8 + 8);
	const bytes = new Uint8Array(buffer) as BytesType;
	const view = new DataView(buffer);

	// from (20 bytes)
	bytes.set(tx.from, 0);

	// to (20 bytes)
	bytes.set(tx.to, 20);

	// value (16 bytes - simplified)
	view.setBigUint64(40, tx.value & 0xffffffffffffffffn, false);
	view.setBigUint64(48, tx.value >> 64n, false);

	// nonce (8 bytes)
	view.setBigUint64(56, tx.nonce, false);

	// gasLimit (8 bytes)
	view.setBigUint64(64, tx.gasLimit, false);

	return bytes;
}

/** Encode transaction index for use as trie key */
function encodeIndex(index: number): BytesType {
	// Simple encoding: convert index to bytes (production uses RLP)
	const bytes = Bytes.fromNumber(index, { size: 8 });

	// Remove leading zeros for compact representation
	return Bytes.trimLeft(bytes);
}

// Create transaction trie
const txTrie = new Trie();

// Transaction 0: Transfer
const tx0: Transaction = {
	from: Address(0x12n),
	to: Address(0x34n),
	value: 1_000_000_000_000_000_000n, // 1 ETH
	nonce: 5n,
	gasLimit: 21000n,
};
const encoded0 = encodeTransaction(tx0);
const key0 = encodeIndex(0);
txTrie.put(key0, encoded0);

// Transaction 1: Contract call
const tx1: Transaction = {
	from: Address(0x56n),
	to: Address(0xabn),
	value: 0n, // No ETH transfer
	nonce: 10n,
	gasLimit: 100000n,
};
const encoded1 = encodeTransaction(tx1);
const key1 = encodeIndex(1);
txTrie.put(key1, encoded1);

// Transaction 2: Another transfer
const tx2: Transaction = {
	from: Address(0x78n),
	to: Address(0x9an),
	value: 500_000_000_000_000_000n, // 0.5 ETH
	nonce: 3n,
	gasLimit: 21000n,
};
const encoded2 = encodeTransaction(tx2);
const key2 = encodeIndex(2);
txTrie.put(key2, encoded2);

// Compute transaction root
const txRoot = txTrie.rootHash();
const key1Verify = encodeIndex(1);
const retrieved = txTrie.get(key1Verify);

/**
 * Transaction Trie Structure:
 *
 * The transaction trie stores all transactions in a block, indexed by their
 * position in the block. The key is the RLP-encoded transaction index, and
 * the value is the RLP-encoded transaction.
 *
 * This allows light clients to:
 * 1. Verify a transaction was included in a block (with Merkle proof)
 * 2. Verify transaction ordering within the block
 * 3. Fetch specific transactions by index without downloading all transactions
 *
 * The transaction root is stored in the block header alongside:
 * - State root (global state trie)
 * - Receipts root (transaction receipts trie)
 */
