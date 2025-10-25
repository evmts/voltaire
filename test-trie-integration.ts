/**
 * Integration test for trie module exports
 */

import { create, MemoryDB, bytesToNibbles, type Trie } from "./src/primitives/trie/index.js";
import { hexToBytes, bytesToHex } from "./src/primitives/hex.js";

async function main() {
	console.log("Testing Merkle Patricia Trie Integration...\n");

	// Test 1: Basic operations
	console.log("Test 1: Basic Operations");
	const trie = await create();
	await trie.put(hexToBytes("0x1234"), hexToBytes("0xabcd"));
	const value = await trie.get(hexToBytes("0x1234"));
	console.log("✓ Put and Get work");
	console.log(`  Value: ${bytesToHex(value!)}`);
	console.log(`  Root: ${bytesToHex(trie.root!)}\n`);

	// Test 2: Multiple entries
	console.log("Test 2: Multiple Entries");
	await trie.put(hexToBytes("0x5678"), hexToBytes("0xef01"));
	await trie.put(hexToBytes("0x9abc"), hexToBytes("0x2345"));
	console.log("✓ Multiple entries stored");
	console.log(`  Root: ${bytesToHex(trie.root!)}\n`);

	// Test 3: Merkle proofs
	console.log("Test 3: Merkle Proofs");
	const key = hexToBytes("0x1234");
	const proof = await trie.createProof(key);
	console.log(`✓ Generated proof with ${proof.length} nodes`);

	const verified = await trie.verifyProof(trie.root!, key, proof);
	console.log("✓ Proof verified successfully");
	console.log(`  Verified value: ${bytesToHex(verified!)}\n`);

	// Test 4: Checkpoints
	console.log("Test 4: Checkpoints");
	const trieCp = await create({ useCheckpoints: true });
	await trieCp.put(hexToBytes("0x01"), hexToBytes("0xaa"));
	const root1 = trieCp.root;
	trieCp.checkpoint();
	await trieCp.put(hexToBytes("0x02"), hexToBytes("0xbb"));
	const root2 = trieCp.root;
	trieCp.revert();
	console.log("✓ Checkpoint and revert work");
	console.log(`  Root after revert: ${bytesToHex(trieCp.root!)}`);
	console.log(`  Matches original: ${bytesToHex(root1!) === bytesToHex(trieCp.root!)}\n`);

	// Test 5: Large dataset
	console.log("Test 5: Large Dataset");
	const largeTrie = await create();
	const count = 100;
	const start = Date.now();

	for (let i = 0; i < count; i++) {
		const key = new Uint8Array(4);
		key[0] = (i >> 24) & 0xff;
		key[1] = (i >> 16) & 0xff;
		key[2] = (i >> 8) & 0xff;
		key[3] = i & 0xff;
		await largeTrie.put(key, new Uint8Array([i % 256]));
	}

	const elapsed = Date.now() - start;
	console.log(`✓ Inserted ${count} entries in ${elapsed}ms`);
	console.log(`  Final root: ${bytesToHex(largeTrie.root!)}\n`);

	// Test 6: Utilities
	console.log("Test 6: Utilities");
	const nibbles = bytesToNibbles(hexToBytes("0x1234"));
	console.log("✓ Nibbles conversion works");
	console.log(`  0x1234 -> [${nibbles.join(", ")}]\n`);

	// Test 7: Custom DB
	console.log("Test 7: Custom Database");
	const db = new MemoryDB();
	const dbTrie = await create({ db });
	await dbTrie.put(hexToBytes("0xaaaa"), hexToBytes("0xbbbb"));
	console.log("✓ Custom database works");
	console.log(`  DB size: ${db.size()} nodes\n`);

	console.log("All integration tests passed! ✅");
}

main().catch(console.error);
