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

	constructor() {
		// Would call native init
		console.log('Initializing Trie...');
	}

	put(key: Uint8Array, value: Uint8Array): void {
		// Would call native put
		console.log(`Put: [${Array.from(key).map((b) => `0x${b.toString(16).padStart(2, '0')}`).join(', ')}]`);
	}

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
		const clean = hex.replace(/^0x/, '');
		return new Uint8Array(clean.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
	}

	static toUtf8(bytes: Uint8Array): string {
		return new TextDecoder().decode(bytes);
	}
}

console.log('=== Basic Trie Operations ===\n');

// Initialize empty trie
const trie = new Trie();

// 1. Empty trie has null root
console.log('1. Empty trie root:', trie.rootHash());

// 2. Insert key-value pairs
console.log('\n2. Inserting three key-value pairs...');
const encoder = new TextEncoder();

trie.put(new Uint8Array([0x12, 0x34]), encoder.encode('first_value'));
trie.put(new Uint8Array([0x56, 0x78]), encoder.encode('second_value'));
trie.put(new Uint8Array([0xab, 0xcd]), encoder.encode('third_value'));

// 3. Root hash changes after insertions
const root = trie.rootHash();
console.log('   Root hash after insertions:', root ? `0x${Array.from(root).map((b) => b.toString(16).padStart(2, '0')).join('')}` : null);

// 4. Retrieve values
console.log('\n3. Retrieving values:');
const val1 = trie.get(new Uint8Array([0x12, 0x34]));
console.log(`   Key [0x12, 0x34] -> ${val1 ? Trie.toUtf8(val1) : 'null'}`);

const val2 = trie.get(new Uint8Array([0x56, 0x78]));
console.log(`   Key [0x56, 0x78] -> ${val2 ? Trie.toUtf8(val2) : 'null'}`);

const val3 = trie.get(new Uint8Array([0xab, 0xcd]));
console.log(`   Key [0xAB, 0xCD] -> ${val3 ? Trie.toUtf8(val3) : 'null'}`);

// 5. Update existing key
console.log('\n4. Updating key [0x12, 0x34]...');
trie.put(new Uint8Array([0x12, 0x34]), encoder.encode('updated_value'));
const updated = trie.get(new Uint8Array([0x12, 0x34]));
console.log(`   New value: ${updated ? Trie.toUtf8(updated) : 'null'}`);

// 6. Delete a key
console.log('\n5. Deleting key [0xAB, 0xCD]...');
trie.delete(new Uint8Array([0xab, 0xcd]));
const deleted = trie.get(new Uint8Array([0xab, 0xcd]));
console.log(`   Value after deletion: ${deleted ? Trie.toUtf8(deleted) : 'null'}`);

// 7. Other keys still accessible
console.log('\n6. Remaining keys still accessible:');
const remaining1 = trie.get(new Uint8Array([0x12, 0x34]));
console.log(`   Key [0x12, 0x34] -> ${remaining1 ? Trie.toUtf8(remaining1) : 'null'}`);

const remaining2 = trie.get(new Uint8Array([0x56, 0x78]));
console.log(`   Key [0x56, 0x78] -> ${remaining2 ? Trie.toUtf8(remaining2) : 'null'}`);

// 8. Query non-existent key
console.log('\n7. Querying non-existent key [0xFF, 0xFF]...');
const missing = trie.get(new Uint8Array([0xff, 0xff]));
console.log(`   Result: ${missing ? Trie.toUtf8(missing) : 'null'}`);

console.log('\n✓ Basic operations completed successfully');

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
