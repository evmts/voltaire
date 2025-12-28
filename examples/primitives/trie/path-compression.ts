/**
 * Path Compression & Common Prefixes
 *
 * Demonstrates how the Merkle Patricia Trie compresses paths when keys share
 * common prefixes, creating extension nodes for efficiency.
 *
 * NOTE: This example shows the intended TypeScript API. Trie is currently implemented
 * in Zig only and not yet exposed to TypeScript through FFI bindings.
 */

import * as Bytes from "../../../src/primitives/Bytes/Bytes.index.js";
import type { BytesType } from "../../../src/primitives/Bytes/BytesType.js";
import type { HashType } from "../../../src/primitives/Hash/HashType.js";
import { Hash } from "../../../src/primitives/Hash/index.js";

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

	clear(): void {
		this.data.clear();
	}
}

const encoder = new TextEncoder();
{
	const trie = new Trie();

	// All keys share prefix [0x01, 0x02, 0x03]
	trie.put(
		Bytes.fromHex("0x01020304"),
		encoder.encode("value_at_04") as BytesType,
	);
	trie.put(
		Bytes.fromHex("0x01020305"),
		encoder.encode("value_at_05") as BytesType,
	);
	trie.put(
		Bytes.fromHex("0x01020306"),
		encoder.encode("value_at_06") as BytesType,
	);

	const root1 = trie.rootHash();
}
{
	const trie = new Trie();

	trie.put(Bytes.fromHex("0x1234"), encoder.encode("short_key") as BytesType);
	trie.put(Bytes.fromHex("0x123456"), encoder.encode("long_key") as BytesType);
	trie.put(
		Bytes.fromHex("0x12345678"),
		encoder.encode("longer_key") as BytesType,
	);

	// All values retrievable
	const short = trie.get(Bytes.fromHex("0x1234"));
	const long = trie.get(Bytes.fromHex("0x123456"));
	const longer = trie.get(Bytes.fromHex("0x12345678"));
}
{
	const trie = new Trie();

	// Start with single key
	trie.put(Bytes.fromHex("0xaabbccdd"), encoder.encode("first") as BytesType);
	const root1 = trie.rootHash();

	// Add key with common prefix of length 2
	trie.put(Bytes.fromHex("0xaabb1122"), encoder.encode("second") as BytesType);
	const root2 = trie.rootHash();

	// Add key diverging earlier
	trie.put(Bytes.fromHex("0xaa334455"), encoder.encode("third") as BytesType);
	const root3 = trie.rootHash();
}
{
	const trie = new Trie();

	// Completely different keys
	trie.put(Bytes.fromHex("0x11"), encoder.encode("first") as BytesType);
	trie.put(Bytes.fromHex("0x22"), encoder.encode("second") as BytesType);
	trie.put(Bytes.fromHex("0x33"), encoder.encode("third") as BytesType);
	trie.put(Bytes.fromHex("0x44"), encoder.encode("fourth") as BytesType);

	const root = trie.rootHash();
}

/**
 * Node Types in Merkle Patricia Trie:
 *
 * 1. **Empty Node**: Represents null/empty state
 *
 * 2. **Leaf Node**: Terminal node with value
 *    - nibbles: Remaining path
 *    - value: Stored data
 *
 * 3. **Extension Node**: Path compression
 *    - nibbles: Shared prefix
 *    - child_hash: Reference to next node
 *
 * 4. **Branch Node**: 16-way branching
 *    - children[16]: Child hashes (one per nibble)
 *    - value: Optional value if key ends at branch
 *
 * The trie automatically chooses the most efficient representation
 * based on the key distribution.
 */
