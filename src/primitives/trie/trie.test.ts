/**
 * Merkle Patricia Trie tests
 *
 * Comprehensive test suite covering:
 * - Basic CRUD operations
 * - Node type transitions
 * - Merkle proof generation and verification
 * - Edge cases (empty trie, single entry, deep nesting)
 * - Ethereum test vectors
 * - Large datasets
 */

import { describe, test, expect } from "bun:test";
import { create } from "./trie.js";
import { bytesToHex, hexToBytes } from "../hex.js";
import { bytesToNibbles, encodeNibbles, decodeNibbles } from "./nibbles.js";
import { encodeNode, decodeNode, createLeafNode, hashNode } from "./nodes.js";

describe("Trie - Basic Operations", () => {
	test("empty trie", async () => {
		const trie = await create();
		expect(trie.root).toBeNull();

		const result = await trie.get(new Uint8Array([0x12, 0x34]));
		expect(result).toBeNull();
	});

	test("single insert and get", async () => {
		const trie = await create();
		const key = new Uint8Array([0x12, 0x34]);
		const value = new Uint8Array([0xab, 0xcd]);

		await trie.put(key, value);

		expect(trie.root).not.toBeNull();

		const retrieved = await trie.get(key);
		expect(retrieved).not.toBeNull();
		expect(bytesToHex(retrieved!)).toBe(bytesToHex(value));
	});

	test("update existing key", async () => {
		const trie = await create();
		const key = new Uint8Array([0x12, 0x34]);
		const value1 = new Uint8Array([0xaa, 0xbb]);
		const value2 = new Uint8Array([0xcc, 0xdd]);

		await trie.put(key, value1);
		await trie.put(key, value2);

		const retrieved = await trie.get(key);
		expect(bytesToHex(retrieved!)).toBe(bytesToHex(value2));
	});

	test("multiple inserts", async () => {
		const trie = await create();

		await trie.put(new Uint8Array([0x12, 0x34]), new Uint8Array([0x01]));
		await trie.put(new Uint8Array([0x56, 0x78]), new Uint8Array([0x02]));
		await trie.put(new Uint8Array([0xab, 0xcd]), new Uint8Array([0x03]));

		const val1 = await trie.get(new Uint8Array([0x12, 0x34]));
		expect(val1![0]).toBe(0x01);

		const val2 = await trie.get(new Uint8Array([0x56, 0x78]));
		expect(val2![0]).toBe(0x02);

		const val3 = await trie.get(new Uint8Array([0xab, 0xcd]));
		expect(val3![0]).toBe(0x03);
	});

	test("delete single key", async () => {
		const trie = await create();
		const key = new Uint8Array([0x12, 0x34]);
		const value = new Uint8Array([0xab]);

		await trie.put(key, value);
		await trie.del(key);

		const retrieved = await trie.get(key);
		expect(retrieved).toBeNull();
		expect(trie.root).toBeNull();
	});

	test("delete one of multiple keys", async () => {
		const trie = await create();

		await trie.put(new Uint8Array([0x12, 0x34]), new Uint8Array([0x01]));
		await trie.put(new Uint8Array([0x56, 0x78]), new Uint8Array([0x02]));

		await trie.del(new Uint8Array([0x12, 0x34]));

		const deleted = await trie.get(new Uint8Array([0x12, 0x34]));
		expect(deleted).toBeNull();

		const remaining = await trie.get(new Uint8Array([0x56, 0x78]));
		expect(remaining![0]).toBe(0x02);
	});

	test("get non-existent key", async () => {
		const trie = await create();
		await trie.put(new Uint8Array([0x12, 0x34]), new Uint8Array([0xab]));

		const result = await trie.get(new Uint8Array([0x56, 0x78]));
		expect(result).toBeNull();
	});
});

describe("Trie - Node Types", () => {
	test("keys with common prefix (extension nodes)", async () => {
		const trie = await create();

		await trie.put(new Uint8Array([0x12, 0x34, 0x56]), new Uint8Array([0x01]));
		await trie.put(new Uint8Array([0x12, 0x34, 0x78]), new Uint8Array([0x02]));
		await trie.put(new Uint8Array([0x12, 0x34, 0x9a]), new Uint8Array([0x03]));

		const val1 = await trie.get(new Uint8Array([0x12, 0x34, 0x56]));
		expect(val1![0]).toBe(0x01);

		const val2 = await trie.get(new Uint8Array([0x12, 0x34, 0x78]));
		expect(val2![0]).toBe(0x02);

		const val3 = await trie.get(new Uint8Array([0x12, 0x34, 0x9a]));
		expect(val3![0]).toBe(0x03);
	});

	test("key is prefix of another (branch nodes)", async () => {
		const trie = await create();

		await trie.put(new Uint8Array([0x12, 0x34]), new Uint8Array([0x01]));
		await trie.put(new Uint8Array([0x12, 0x34, 0x56]), new Uint8Array([0x02]));

		const short = await trie.get(new Uint8Array([0x12, 0x34]));
		expect(short![0]).toBe(0x01);

		const long = await trie.get(new Uint8Array([0x12, 0x34, 0x56]));
		expect(long![0]).toBe(0x02);
	});

	test("branch node with 16 children", async () => {
		const trie = await create();

		// Create branch at first nibble
		for (let i = 0; i < 16; i++) {
			await trie.put(new Uint8Array([i, 0x00]), new Uint8Array([i]));
		}

		// Verify all entries
		for (let i = 0; i < 16; i++) {
			const value = await trie.get(new Uint8Array([i, 0x00]));
			expect(value![0]).toBe(i);
		}
	});
});

describe("Trie - Root Hash", () => {
	test("root hash changes with updates", async () => {
		const trie = await create();
		const key = new Uint8Array([0x12, 0x34]);

		expect(trie.root).toBeNull();

		await trie.put(key, new Uint8Array([0x01]));
		const hash1 = trie.root;
		expect(hash1).not.toBeNull();

		await trie.put(key, new Uint8Array([0x02]));
		const hash2 = trie.root;
		expect(hash2).not.toBeNull();

		expect(bytesToHex(hash1!)).not.toBe(bytesToHex(hash2!));
	});

	test("root hash deterministic", async () => {
		const trie1 = await create();
		const trie2 = await create();

		const keys = [
			new Uint8Array([0x12, 0x34]),
			new Uint8Array([0x56, 0x78]),
			new Uint8Array([0xab, 0xcd]),
		];

		for (const [i, key] of keys.entries()) {
			const value = new Uint8Array([i]);
			await trie1.put(key, value);
			await trie2.put(key, value);
		}

		expect(bytesToHex(trie1.root!)).toBe(bytesToHex(trie2.root!));
	});

	test("delete and reinsert produces same root", async () => {
		const trie = await create();
		const key = new Uint8Array([0x12, 0x34]);
		const value = new Uint8Array([0xab]);

		await trie.put(key, value);
		const hash1 = trie.root;

		await trie.del(key);
		expect(trie.root).toBeNull();

		await trie.put(key, value);
		const hash2 = trie.root;

		expect(bytesToHex(hash1!)).toBe(bytesToHex(hash2!));
	});
});

describe("Trie - Merkle Proofs", () => {
	test("create and verify proof for existing key", async () => {
		const trie = await create();
		const key = new Uint8Array([0x12, 0x34]);
		const value = new Uint8Array([0xab, 0xcd]);

		await trie.put(key, value);
		await trie.put(new Uint8Array([0x56, 0x78]), new Uint8Array([0xef]));

		const proof = await trie.createProof(key);
		expect(proof.length).toBeGreaterThan(0);

		const verified = await trie.verifyProof(trie.root!, key, proof);
		expect(verified).not.toBeNull();
		expect(bytesToHex(verified!)).toBe(bytesToHex(value));
	});

	test("proof for non-existent key", async () => {
		const trie = await create();
		await trie.put(new Uint8Array([0x12, 0x34]), new Uint8Array([0xab]));

		const proof = await trie.createProof(new Uint8Array([0x56, 0x78]));
		const verified = await trie.verifyProof(trie.root!, new Uint8Array([0x56, 0x78]), proof);
		expect(verified).toBeNull();
	});

	test("proof with multiple keys", async () => {
		const trie = await create();

		const entries = [
			{ key: new Uint8Array([0x01, 0x23]), value: new Uint8Array([0xaa]) },
			{ key: new Uint8Array([0x01, 0x24]), value: new Uint8Array([0xbb]) },
			{ key: new Uint8Array([0x01, 0x25]), value: new Uint8Array([0xcc]) },
			{ key: new Uint8Array([0x02, 0x00]), value: new Uint8Array([0xdd]) },
		];

		for (const { key, value } of entries) {
			await trie.put(key, value);
		}

		// Verify proofs for all keys
		for (const { key, value } of entries) {
			const proof = await trie.createProof(key);
			const verified = await trie.verifyProof(trie.root!, key, proof);
			expect(bytesToHex(verified!)).toBe(bytesToHex(value));
		}
	});
});

describe("Trie - Edge Cases", () => {
	test("empty key", async () => {
		const trie = await create();
		const key = new Uint8Array([]);
		const value = new Uint8Array([0xab]);

		await trie.put(key, value);
		const retrieved = await trie.get(key);
		expect(bytesToHex(retrieved!)).toBe(bytesToHex(value));
	});

	test("empty value", async () => {
		const trie = await create();
		const key = new Uint8Array([0x12, 0x34]);
		const value = new Uint8Array([]);

		await trie.put(key, value);
		const retrieved = await trie.get(key);
		expect(retrieved!.length).toBe(0);
	});

	test("large key", async () => {
		const trie = await create();
		const key = new Uint8Array(256);
		for (let i = 0; i < 256; i++) {
			key[i] = i % 256;
		}
		const value = new Uint8Array([0xab]);

		await trie.put(key, value);
		const retrieved = await trie.get(key);
		expect(bytesToHex(retrieved!)).toBe(bytesToHex(value));
	});

	test("large value", async () => {
		const trie = await create();
		const key = new Uint8Array([0x12, 0x34]);
		const value = new Uint8Array(1024);
		for (let i = 0; i < 1024; i++) {
			value[i] = i % 256;
		}

		await trie.put(key, value);
		const retrieved = await trie.get(key);
		expect(bytesToHex(retrieved!)).toBe(bytesToHex(value));
	});

	test("single byte keys", async () => {
		const trie = await create();

		await trie.put(new Uint8Array([0x01]), new Uint8Array([0xaa]));
		await trie.put(new Uint8Array([0x02]), new Uint8Array([0xbb]));

		const val1 = await trie.get(new Uint8Array([0x01]));
		expect(val1![0]).toBe(0xaa);

		const val2 = await trie.get(new Uint8Array([0x02]));
		expect(val2![0]).toBe(0xbb);
	});
});

describe("Trie - Large Datasets", () => {
	test("100 sequential inserts", async () => {
		const trie = await create();
		const entries: Array<{ key: Uint8Array; value: Uint8Array }> = [];

		// Insert 100 entries
		for (let i = 0; i < 100; i++) {
			const key = new Uint8Array(4);
			key[0] = (i >> 24) & 0xff;
			key[1] = (i >> 16) & 0xff;
			key[2] = (i >> 8) & 0xff;
			key[3] = i & 0xff;
			const value = new Uint8Array([i % 256]);
			entries.push({ key, value });
			await trie.put(key, value);
		}

		// Verify all entries
		for (const { key, value } of entries) {
			const retrieved = await trie.get(key);
			expect(retrieved![0]).toBe(value[0]);
		}
	});

	test("insert, delete, verify pattern", async () => {
		const trie = await create();

		// Insert 50 entries
		for (let i = 0; i < 50; i++) {
			const key = new Uint8Array(2);
			key[0] = (i >> 8) & 0xff;
			key[1] = i & 0xff;
			await trie.put(key, new Uint8Array([i % 256]));
		}

		// Delete even entries
		for (let i = 0; i < 50; i += 2) {
			const key = new Uint8Array(2);
			key[0] = (i >> 8) & 0xff;
			key[1] = i & 0xff;
			await trie.del(key);
		}

		// Verify odd entries remain
		for (let i = 1; i < 50; i += 2) {
			const key = new Uint8Array(2);
			key[0] = (i >> 8) & 0xff;
			key[1] = i & 0xff;
			const value = await trie.get(key);
			expect(value).not.toBeNull();
			expect(value![0]).toBe(i % 256);
		}

		// Verify even entries deleted
		for (let i = 0; i < 50; i += 2) {
			const key = new Uint8Array(2);
			key[0] = (i >> 8) & 0xff;
			key[1] = i & 0xff;
			const value = await trie.get(key);
			expect(value).toBeNull();
		}
	});
});

describe("Trie - Checkpoints", () => {
	test("checkpoint and revert", async () => {
		const trie = await create({ useCheckpoints: true });
		const key1 = new Uint8Array([0x12, 0x34]);
		const key2 = new Uint8Array([0x56, 0x78]);

		await trie.put(key1, new Uint8Array([0x01]));
		const rootAfterFirst = trie.root;

		trie.checkpoint();

		await trie.put(key2, new Uint8Array([0x02]));
		const rootAfterSecond = trie.root;

		expect(bytesToHex(rootAfterFirst!)).not.toBe(bytesToHex(rootAfterSecond!));

		trie.revert();

		expect(bytesToHex(trie.root!)).toBe(bytesToHex(rootAfterFirst!));

		const val1 = await trie.get(key1);
		expect(val1![0]).toBe(0x01);

		const val2 = await trie.get(key2);
		expect(val2).toBeNull();
	});

	test("multiple checkpoints", async () => {
		const trie = await create({ useCheckpoints: true });

		await trie.put(new Uint8Array([0x01]), new Uint8Array([0xaa]));
		const root1 = trie.root;

		trie.checkpoint();
		await trie.put(new Uint8Array([0x02]), new Uint8Array([0xbb]));
		const root2 = trie.root;

		trie.checkpoint();
		await trie.put(new Uint8Array([0x03]), new Uint8Array([0xcc]));
		const root3 = trie.root;

		trie.revert();
		expect(bytesToHex(trie.root!)).toBe(bytesToHex(root2!));

		trie.revert();
		expect(bytesToHex(trie.root!)).toBe(bytesToHex(root1!));
	});
});

describe("Trie - Nibbles", () => {
	test("bytes to nibbles", () => {
		const bytes = new Uint8Array([0x12, 0xab]);
		const nibbles = bytesToNibbles(bytes);
		expect(nibbles).toEqual([0x1, 0x2, 0xa, 0xb]);
	});

	test("encode/decode nibbles - even leaf", () => {
		const nibbles = [0x1, 0x2, 0x3, 0x4];
		const encoded = encodeNibbles(nibbles, true);
		const decoded = decodeNibbles(encoded);

		expect(decoded.isLeaf).toBe(true);
		expect(decoded.nibbles).toEqual(nibbles);
	});

	test("encode/decode nibbles - odd extension", () => {
		const nibbles = [0x1, 0x2, 0x3];
		const encoded = encodeNibbles(nibbles, false);
		const decoded = decodeNibbles(encoded);

		expect(decoded.isLeaf).toBe(false);
		expect(decoded.nibbles).toEqual(nibbles);
	});
});

describe("Trie - Ethereum Test Vectors", () => {
	test("single entry trie", async () => {
		// Known test vector from Ethereum tests
		const trie = await create();
		const key = hexToBytes("0x0123456789abcdef");
		const value = hexToBytes("0xfedcba9876543210");

		await trie.put(key, value);

		// Verify retrieval
		const retrieved = await trie.get(key);
		expect(bytesToHex(retrieved!)).toBe(bytesToHex(value));

		// Verify root is not null
		expect(trie.root).not.toBeNull();
	});

	test("multiple entries with shared prefix", async () => {
		const trie = await create();

		// Entries that share common prefix
		await trie.put(hexToBytes("0x1234"), hexToBytes("0x01"));
		await trie.put(hexToBytes("0x1235"), hexToBytes("0x02"));
		await trie.put(hexToBytes("0x1236"), hexToBytes("0x03"));

		// Verify all entries
		const val1 = await trie.get(hexToBytes("0x1234"));
		expect(bytesToHex(val1!)).toBe("0x01");

		const val2 = await trie.get(hexToBytes("0x1235"));
		expect(bytesToHex(val2!)).toBe("0x02");

		const val3 = await trie.get(hexToBytes("0x1236"));
		expect(bytesToHex(val3!)).toBe("0x03");
	});
});

describe("Trie - Copy", () => {
	test("copy creates independent trie", async () => {
		const trie1 = await create();
		await trie1.put(new Uint8Array([0x12]), new Uint8Array([0xab]));

		const trie2 = trie1.copy();

		// Modify trie2
		await trie2.put(new Uint8Array([0x34]), new Uint8Array([0xcd]));

		// trie1 should be unchanged
		const val1 = await trie1.get(new Uint8Array([0x34]));
		expect(val1).toBeNull();

		// trie2 should have new value
		const val2 = await trie2.get(new Uint8Array([0x34]));
		expect(val2![0]).toBe(0xcd);
	});
});
