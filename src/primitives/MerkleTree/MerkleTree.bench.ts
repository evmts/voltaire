/**
 * MerkleTree Benchmarks: Voltaire TS
 *
 * Compares merkle tree operations - from, getProof, verify.
 */

import { bench, run } from "mitata";
import type { HashType } from "../Hash/HashType.js";
import * as MerkleTree from "./index.js";

// ============================================================================
// Test Data - Realistic merkle tree data
// ============================================================================

// Helper to create leaf hashes
function createLeaf(index: number): HashType {
	const arr = new Uint8Array(32);
	arr[0] = index & 0xff;
	arr[1] = (index >> 8) & 0xff;
	arr[31] = 0x01;
	return arr as HashType;
}

// Small tree (4 leaves - 2 levels)
const smallLeaves = Array.from({ length: 4 }, (_, i) => createLeaf(i));

// Medium tree (16 leaves - 4 levels)
const mediumLeaves = Array.from({ length: 16 }, (_, i) => createLeaf(i));

// Large tree (256 leaves - 8 levels)
const largeLeaves = Array.from({ length: 256 }, (_, i) => createLeaf(i));

// Very large tree (1024 leaves - 10 levels)
const veryLargeLeaves = Array.from({ length: 1024 }, (_, i) => createLeaf(i));

// Single leaf tree
const singleLeaf = [createLeaf(0)];

// ============================================================================
// from Benchmarks
// ============================================================================

bench("MerkleTree.from - 1 leaf", () => {
	MerkleTree.from(singleLeaf);
});

await run();

bench("MerkleTree.from - 4 leaves", () => {
	MerkleTree.from(smallLeaves);
});

await run();

bench("MerkleTree.from - 16 leaves", () => {
	MerkleTree.from(mediumLeaves);
});

await run();

bench("MerkleTree.from - 256 leaves", () => {
	MerkleTree.from(largeLeaves);
});

await run();

bench("MerkleTree.from - 1024 leaves", () => {
	MerkleTree.from(veryLargeLeaves);
});

await run();

// ============================================================================
// getProof Benchmarks
// ============================================================================

bench("MerkleTree.getProof - 4 leaves (first)", () => {
	MerkleTree.getProof(smallLeaves, 0);
});

await run();

bench("MerkleTree.getProof - 4 leaves (last)", () => {
	MerkleTree.getProof(smallLeaves, 3);
});

await run();

bench("MerkleTree.getProof - 16 leaves (middle)", () => {
	MerkleTree.getProof(mediumLeaves, 8);
});

await run();

bench("MerkleTree.getProof - 256 leaves (first)", () => {
	MerkleTree.getProof(largeLeaves, 0);
});

await run();

bench("MerkleTree.getProof - 256 leaves (last)", () => {
	MerkleTree.getProof(largeLeaves, 255);
});

await run();

bench("MerkleTree.getProof - 1024 leaves (middle)", () => {
	MerkleTree.getProof(veryLargeLeaves, 512);
});

await run();

// ============================================================================
// verify Benchmarks
// ============================================================================

// Pre-generate proofs for verification
const smallTree = MerkleTree.from(smallLeaves);
const smallProof = MerkleTree.getProof(smallLeaves, 0);

const mediumTree = MerkleTree.from(mediumLeaves);
const mediumProof = MerkleTree.getProof(mediumLeaves, 8);

const largeTree = MerkleTree.from(largeLeaves);
const largeProof = MerkleTree.getProof(largeLeaves, 128);

const veryLargeTree = MerkleTree.from(veryLargeLeaves);
const veryLargeProof = MerkleTree.getProof(veryLargeLeaves, 512);

bench("MerkleTree.verify - 4 leaves (valid)", () => {
	MerkleTree.verify(smallProof, smallTree.root);
});

await run();

bench("MerkleTree.verify - 16 leaves (valid)", () => {
	MerkleTree.verify(mediumProof, mediumTree.root);
});

await run();

bench("MerkleTree.verify - 256 leaves (valid)", () => {
	MerkleTree.verify(largeProof, largeTree.root);
});

await run();

bench("MerkleTree.verify - 1024 leaves (valid)", () => {
	MerkleTree.verify(veryLargeProof, veryLargeTree.root);
});

await run();

// Invalid proofs
const invalidRoot = createLeaf(999);

bench("MerkleTree.verify - 256 leaves (invalid)", () => {
	MerkleTree.verify(largeProof, invalidRoot);
});

await run();

// ============================================================================
// Combined Operations
// ============================================================================

bench("MerkleTree - build + getProof + verify (16 leaves)", () => {
	const tree = MerkleTree.from(mediumLeaves);
	const proof = MerkleTree.getProof(mediumLeaves, 8);
	MerkleTree.verify(proof, tree.root);
});

await run();

bench("MerkleTree - build + getProof + verify (256 leaves)", () => {
	const tree = MerkleTree.from(largeLeaves);
	const proof = MerkleTree.getProof(largeLeaves, 128);
	MerkleTree.verify(proof, tree.root);
});

await run();

// ============================================================================
// Proof Generation for All Leaves
// ============================================================================

bench("MerkleTree.getProof - all 16 leaves", () => {
	for (let i = 0; i < 16; i++) {
		MerkleTree.getProof(mediumLeaves, i);
	}
});

await run();

bench("MerkleTree.getProof - all 256 leaves", () => {
	for (let i = 0; i < 256; i++) {
		MerkleTree.getProof(largeLeaves, i);
	}
});

await run();

// ============================================================================
// Non-power-of-2 Leaf Counts
// ============================================================================

const leaves5 = Array.from({ length: 5 }, (_, i) => createLeaf(i));
const leaves17 = Array.from({ length: 17 }, (_, i) => createLeaf(i));
const leaves100 = Array.from({ length: 100 }, (_, i) => createLeaf(i));

bench("MerkleTree.from - 5 leaves (non-power-of-2)", () => {
	MerkleTree.from(leaves5);
});

await run();

bench("MerkleTree.from - 17 leaves (non-power-of-2)", () => {
	MerkleTree.from(leaves17);
});

await run();

bench("MerkleTree.from - 100 leaves (non-power-of-2)", () => {
	MerkleTree.from(leaves100);
});

await run();
