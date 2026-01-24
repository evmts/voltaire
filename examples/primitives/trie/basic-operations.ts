/**
 * Basic Trie Operations
 *
 * Demonstrates fundamental insert, get, and delete operations on a Merkle Patricia Trie.
 *
 * NOTE: This example shows the intended TypeScript API. Trie is currently implemented
 * in Zig only and not yet exposed to TypeScript through FFI bindings.
 */

import { Bytes, Hash } from "@tevm/voltaire";
import type { BytesType } from "@tevm/voltaire/Bytes";
import type { HashType } from "@tevm/voltaire/Hash";

// Conceptual implementation for demonstration
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

	delete(key: BytesType): void {
		const hex = Bytes.toHex(key);
		this.data.delete(hex);
	}

	rootHash(): HashType | null {
		if (this.data.size === 0) return null;
		return Hash.random();
	}

	clear(): void {
		this.data.clear();
	}
}

// Initialize empty trie
const trie = new Trie();
const encoder = new TextEncoder();

trie.put(Bytes.fromHex("0x1234"), encoder.encode("first_value") as BytesType);
trie.put(Bytes.fromHex("0x5678"), encoder.encode("second_value") as BytesType);
trie.put(Bytes.fromHex("0xabcd"), encoder.encode("third_value") as BytesType);

// 3. Root hash changes after insertions
const root = trie.rootHash();
const val1 = trie.get(Bytes.fromHex("0x1234"));

const val2 = trie.get(Bytes.fromHex("0x5678"));

const val3 = trie.get(Bytes.fromHex("0xabcd"));
trie.put(Bytes.fromHex("0x1234"), encoder.encode("updated_value") as BytesType);
const updated = trie.get(Bytes.fromHex("0x1234"));
trie.delete(Bytes.fromHex("0xabcd"));
const deleted = trie.get(Bytes.fromHex("0xabcd"));
const remaining1 = trie.get(Bytes.fromHex("0x1234"));

const remaining2 = trie.get(Bytes.fromHex("0x5678"));
const missing = trie.get(Bytes.fromHex("0xffff"));

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
