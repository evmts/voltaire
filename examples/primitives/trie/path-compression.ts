/**
 * Path Compression & Common Prefixes
 *
 * Demonstrates how the Merkle Patricia Trie compresses paths when keys share
 * common prefixes, creating extension nodes for efficiency.
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

	clear(): void {
		this.data.clear();
	}
}

function formatHash(hash: Uint8Array | null): string {
	if (!hash) return "null";
	return `0x${Array.from(hash)
		.slice(0, 8)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}...`;
}

const encoder = new TextEncoder();
{
	const trie = new Trie();

	// All keys share prefix [0x01, 0x02, 0x03]
	trie.put(
		new Uint8Array([0x01, 0x02, 0x03, 0x04]),
		encoder.encode("value_at_04"),
	);
	trie.put(
		new Uint8Array([0x01, 0x02, 0x03, 0x05]),
		encoder.encode("value_at_05"),
	);
	trie.put(
		new Uint8Array([0x01, 0x02, 0x03, 0x06]),
		encoder.encode("value_at_06"),
	);

	const root1 = trie.rootHash();
}
{
	const trie = new Trie();

	trie.put(new Uint8Array([0x12, 0x34]), encoder.encode("short_key"));
	trie.put(new Uint8Array([0x12, 0x34, 0x56]), encoder.encode("long_key"));
	trie.put(
		new Uint8Array([0x12, 0x34, 0x56, 0x78]),
		encoder.encode("longer_key"),
	);

	// All values retrievable
	const short = trie.get(new Uint8Array([0x12, 0x34]));
	const long = trie.get(new Uint8Array([0x12, 0x34, 0x56]));
	const longer = trie.get(new Uint8Array([0x12, 0x34, 0x56, 0x78]));
}
{
	const trie = new Trie();

	// Start with single key
	trie.put(new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd]), encoder.encode("first"));
	const root1 = trie.rootHash();

	// Add key with common prefix of length 2
	trie.put(new Uint8Array([0xaa, 0xbb, 0x11, 0x22]), encoder.encode("second"));
	const root2 = trie.rootHash();

	// Add key diverging earlier
	trie.put(new Uint8Array([0xaa, 0x33, 0x44, 0x55]), encoder.encode("third"));
	const root3 = trie.rootHash();
}
{
	const trie = new Trie();

	// Completely different keys
	trie.put(new Uint8Array([0x11]), encoder.encode("first"));
	trie.put(new Uint8Array([0x22]), encoder.encode("second"));
	trie.put(new Uint8Array([0x33]), encoder.encode("third"));
	trie.put(new Uint8Array([0x44]), encoder.encode("fourth"));

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
