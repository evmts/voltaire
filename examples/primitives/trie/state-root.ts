/**
 * State Root Computation
 *
 * Demonstrates using a Merkle Patricia Trie to compute Ethereum state root.
 * Each account address maps to its account state (nonce, balance, storage root, code hash).
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
		// Mock hash
		const hash = new Uint8Array(32);
		crypto.getRandomValues(hash);
		return hash;
	}
}

/** Simplified account state structure */
interface AccountState {
	nonce: bigint;
	balance: bigint;
	storageRoot: Uint8Array;
	codeHash: Uint8Array;
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

// Create state trie
const stateTrie = new Trie();

// Account 1: EOA with balance
const addr1 = new Uint8Array([0x12, ...new Array(19).fill(0)]);
const account1: AccountState = {
	nonce: 5n,
	balance: 1_000_000_000_000_000_000n, // 1 ETH in wei
	storageRoot: new Uint8Array(32), // Empty storage
	codeHash: new Uint8Array(32), // No code (EOA)
};

const encoded1 = encodeAccountState(account1);
stateTrie.put(addr1, encoded1);

// Account 2: Contract with storage
const addr2 = new Uint8Array([0xab, ...new Array(19).fill(0)]);
const account2: AccountState = {
	nonce: 1n,
	balance: 500_000_000_000_000_000n, // 0.5 ETH
	storageRoot: new Uint8Array(32).fill(0xaa), // Has storage
	codeHash: new Uint8Array(32).fill(0xbb), // Has code
};

const encoded2 = encodeAccountState(account2);
stateTrie.put(addr2, encoded2);

// Account 3: Another EOA
const addr3 = new Uint8Array([0x34, ...new Array(19).fill(0)]);
const account3: AccountState = {
	nonce: 0n,
	balance: 2_500_000_000_000_000_000n, // 2.5 ETH
	storageRoot: new Uint8Array(32),
	codeHash: new Uint8Array(32),
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
