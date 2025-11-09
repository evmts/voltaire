/**
 * Basic Trie Operations
 *
 * Demonstrates fundamental insert, get, and delete operations on a Merkle Patricia Trie.
 *
 * NOTE: This example shows the intended TypeScript API. Trie is currently implemented
 * in Zig only and not yet exposed to TypeScript through FFI bindings.
 */

// Future API once Trie is exposed via FFI
// import { Trie } from '../../src/primitives/Trie/index.js';

// Conceptual implementation for demonstration
class Trie {
	private native: unknown; // Would be native FFI binding

	put(key: Uint8Array, value: Uint8Array): void {}

	get(key: Uint8Array): Uint8Array | null {
		// Would call native get
		return null;
	}

	delete(key: Uint8Array): void {
		// Would call native delete
	}

	rootHash(): Uint8Array | null {
		// Would call native root_hash
		return new Uint8Array(32); // Mock hash
	}

	clear(): void {
		// Would call native clear
	}

	// Helper for demo
	static fromHex(hex: string): Uint8Array {
		const clean = hex.replace(/^0x/, "");
		return new Uint8Array(
			clean.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)),
		);
	}

	static toUtf8(bytes: Uint8Array): string {
		return new TextDecoder().decode(bytes);
	}
}

// Initialize empty trie
const trie = new Trie();
const encoder = new TextEncoder();

trie.put(new Uint8Array([0x12, 0x34]), encoder.encode("first_value"));
trie.put(new Uint8Array([0x56, 0x78]), encoder.encode("second_value"));
trie.put(new Uint8Array([0xab, 0xcd]), encoder.encode("third_value"));

// 3. Root hash changes after insertions
const root = trie.rootHash();
const val1 = trie.get(new Uint8Array([0x12, 0x34]));

const val2 = trie.get(new Uint8Array([0x56, 0x78]));

const val3 = trie.get(new Uint8Array([0xab, 0xcd]));
trie.put(new Uint8Array([0x12, 0x34]), encoder.encode("updated_value"));
const updated = trie.get(new Uint8Array([0x12, 0x34]));
trie.delete(new Uint8Array([0xab, 0xcd]));
const deleted = trie.get(new Uint8Array([0xab, 0xcd]));
const remaining1 = trie.get(new Uint8Array([0x12, 0x34]));

const remaining2 = trie.get(new Uint8Array([0x56, 0x78]));
const missing = trie.get(new Uint8Array([0xff, 0xff]));

/**
 * Expected API usage once FFI bindings are available:
 *
 * ```typescript
 * import { Trie } from '@voltaire/primitives';
 *
 * const trie = new Trie();
 *
 * // Insert
 * trie.put(key, value);
 *
 * // Get
 * const value = trie.get(key);
 *
 * // Delete
 * trie.delete(key);
 *
 * // Root hash
 * const root = trie.rootHash();
 *
 * // Clear
 * trie.clear();
 * ```
 */
