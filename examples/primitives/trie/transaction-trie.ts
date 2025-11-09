/**
 * Transaction Trie
 *
 * Demonstrates building a transaction trie for a block. In Ethereum, each block
 * contains a trie of transactions ordered by their index in the block.
 *
 * NOTE: This example shows the intended TypeScript API. Trie is currently implemented
 * in Zig only and not yet exposed to TypeScript through FFI bindings.
 */

// Conceptual Trie implementation for demonstration
class Trie {
	private data = new Map<string, Uint8Array>();

	put(key: Uint8Array, value: Uint8Array): void {
		this.data.set(Buffer.from(key).toString("hex"), value);
	}

	get(key: Uint8Array): Uint8Array | null {
		return this.data.get(Buffer.from(key).toString("hex")) || null;
	}

	rootHash(): Uint8Array | null {
		if (this.data.size === 0) return null;
		const hash = new Uint8Array(32);
		crypto.getRandomValues(hash);
		return hash;
	}
}

/** Simplified transaction representation */
interface Transaction {
	from: Uint8Array;
	to: Uint8Array;
	value: bigint;
	nonce: bigint;
	gasLimit: bigint;
}

/** Encode transaction to bytes (simplified - production uses RLP) */
function encodeTransaction(tx: Transaction): Uint8Array {
	const buffer = new ArrayBuffer(20 + 20 + 16 + 8 + 8);
	const bytes = new Uint8Array(buffer);
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
function encodeIndex(index: number): Uint8Array {
	// Simple encoding: convert index to bytes (production uses RLP)
	const bytes = new Uint8Array(8);
	const view = new DataView(bytes.buffer);
	view.setBigUint64(0, BigInt(index), false);

	// Remove leading zeros for compact representation
	let start = 0;
	while (start < bytes.length - 1 && bytes[start] === 0) {
		start++;
	}

	return bytes.slice(start);
}

function formatAddress(addr: Uint8Array): string {
	return `0x${Array.from(addr)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}

function formatHash(hash: Uint8Array): string {
	return `0x${Array.from(hash)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}

// Create transaction trie
const txTrie = new Trie();

// Transaction 0: Transfer
const tx0: Transaction = {
	from: new Uint8Array([0x12, ...new Array(19).fill(0)]),
	to: new Uint8Array([0x34, ...new Array(19).fill(0)]),
	value: 1_000_000_000_000_000_000n, // 1 ETH
	nonce: 5n,
	gasLimit: 21000n,
};
const encoded0 = encodeTransaction(tx0);
const key0 = encodeIndex(0);
txTrie.put(key0, encoded0);

// Transaction 1: Contract call
const tx1: Transaction = {
	from: new Uint8Array([0x56, ...new Array(19).fill(0)]),
	to: new Uint8Array([0xab, ...new Array(19).fill(0)]),
	value: 0n, // No ETH transfer
	nonce: 10n,
	gasLimit: 100000n,
};
const encoded1 = encodeTransaction(tx1);
const key1 = encodeIndex(1);
txTrie.put(key1, encoded1);

// Transaction 2: Another transfer
const tx2: Transaction = {
	from: new Uint8Array([0x78, ...new Array(19).fill(0)]),
	to: new Uint8Array([0x9a, ...new Array(19).fill(0)]),
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
