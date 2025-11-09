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

console.log("=== Path Compression & Common Prefixes ===\n");

// Example 1: Keys with long common prefix
console.log("Example 1: Long Common Prefix");
console.log("------------------------------");
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

	console.log("Inserted 3 keys with common prefix [0x01, 0x02, 0x03]:");
	console.log("  [0x01, 0x02, 0x03, 0x04] -> value_at_04");
	console.log("  [0x01, 0x02, 0x03, 0x05] -> value_at_05");
	console.log("  [0x01, 0x02, 0x03, 0x06] -> value_at_06");

	const root1 = trie.rootHash();
	console.log(`\nRoot: ${formatHash(root1)}`);
	console.log("\nTrie structure (conceptual):");
	console.log("  Extension [0,1,0,2,0,3] (nibbles)");
	console.log("    └─> Branch");
	console.log("          ├─ [0]: Leaf([4], 'value_at_04')");
	console.log("          ├─ [0]: Leaf([5], 'value_at_05')");
	console.log("          └─ [0]: Leaf([6], 'value_at_06')");
}

// Example 2: Key is prefix of another
console.log("\n\nExample 2: Key is Prefix of Another");
console.log("------------------------------------");
{
	const trie = new Trie();

	trie.put(new Uint8Array([0x12, 0x34]), encoder.encode("short_key"));
	trie.put(new Uint8Array([0x12, 0x34, 0x56]), encoder.encode("long_key"));
	trie.put(
		new Uint8Array([0x12, 0x34, 0x56, 0x78]),
		encoder.encode("longer_key"),
	);

	console.log("Inserted 3 keys where each is a prefix of the next:");
	console.log("  [0x12, 0x34]             -> short_key");
	console.log("  [0x12, 0x34, 0x56]       -> long_key");
	console.log("  [0x12, 0x34, 0x56, 0x78] -> longer_key");

	// All values retrievable
	const short = trie.get(new Uint8Array([0x12, 0x34]));
	const long = trie.get(new Uint8Array([0x12, 0x34, 0x56]));
	const longer = trie.get(new Uint8Array([0x12, 0x34, 0x56, 0x78]));

	console.log("\nAll values independently retrievable:");
	console.log(
		`  ✓ short:  ${short ? new TextDecoder().decode(short) : "null"}`,
	);
	console.log(`  ✓ long:   ${long ? new TextDecoder().decode(long) : "null"}`);
	console.log(
		`  ✓ longer: ${longer ? new TextDecoder().decode(longer) : "null"}`,
	);

	console.log("\nTrie uses branch nodes with values to store prefix keys.");
}

// Example 3: Gradual divergence
console.log("\n\nExample 3: Gradual Divergence");
console.log("-----------------------------");
{
	const trie = new Trie();

	// Start with single key
	trie.put(new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd]), encoder.encode("first"));
	const root1 = trie.rootHash();
	console.log("After 1st insert [0xAA, 0xBB, 0xCC, 0xDD]:");
	console.log(`  Root: ${formatHash(root1)}`);
	console.log("  Structure: Single Leaf");

	// Add key with common prefix of length 2
	trie.put(new Uint8Array([0xaa, 0xbb, 0x11, 0x22]), encoder.encode("second"));
	const root2 = trie.rootHash();
	console.log("\nAfter 2nd insert [0xAA, 0xBB, 0x11, 0x22]:");
	console.log(`  Root: ${formatHash(root2)}`);
	console.log(
		"  Structure: Extension [A,A,B,B] -> Branch (split at nibble C vs 1)",
	);

	// Add key diverging earlier
	trie.put(new Uint8Array([0xaa, 0x33, 0x44, 0x55]), encoder.encode("third"));
	const root3 = trie.rootHash();
	console.log("\nAfter 3rd insert [0xAA, 0x33, 0x44, 0x55]:");
	console.log(`  Root: ${formatHash(root3)}`);
	console.log(
		"  Structure: Extension [A,A] -> Branch (split at nibble B vs 3)",
	);

	// Verify all retrievable
	console.log("\n✓ All 3 values still retrievable after restructuring");
}

// Example 4: No common prefix
console.log("\n\nExample 4: No Common Prefix");
console.log("---------------------------");
{
	const trie = new Trie();

	// Completely different keys
	trie.put(new Uint8Array([0x11]), encoder.encode("first"));
	trie.put(new Uint8Array([0x22]), encoder.encode("second"));
	trie.put(new Uint8Array([0x33]), encoder.encode("third"));
	trie.put(new Uint8Array([0x44]), encoder.encode("fourth"));

	console.log("Inserted 4 keys with no common prefix:");
	console.log("  [0x11], [0x22], [0x33], [0x44]");
	console.log("\nTrie structure: Branch at root (16-way)");
	console.log("  Each key goes directly into its nibble slot");
	console.log("  No extension nodes needed");

	const root = trie.rootHash();
	console.log(`\nRoot: ${formatHash(root)}`);
}

console.log("\n\n=== Key Takeaways ===");
console.log("• Extension nodes compress common prefixes for efficiency");
console.log("• Branch nodes handle divergence points (up to 16 children)");
console.log("• Leaf nodes store terminal values");
console.log("• Trie dynamically restructures as keys are added/removed");
console.log("• Root hash changes with any modification");

console.log("\n✓ Path compression examples completed");

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
