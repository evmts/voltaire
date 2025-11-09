/**
 * Merkle Tree with SHA256 Example
 *
 * Demonstrates building authenticated data structures:
 * - Merkle tree construction
 * - Merkle proofs
 * - Verification
 * - Bitcoin-style double hashing
 */

import { SHA256 } from '../../../src/crypto/sha256/SHA256.js';

console.log('=== SHA256 Merkle Tree ===\n');

// Helper: Double SHA-256 (Bitcoin style)
function doubleSha256(data: Uint8Array): Uint8Array {
  return SHA256.hash(SHA256.hash(data));
}

// Build Merkle tree from leaves
function buildMerkleTree(leaves: Uint8Array[]): Uint8Array[][] {
  if (leaves.length === 0) {
    throw new Error('Cannot build tree from empty leaves');
  }

  const tree: Uint8Array[][] = [];

  // First level: hash all leaves
  tree.push(leaves.map(leaf => doubleSha256(leaf)));

  // Build subsequent levels
  let currentLevel = tree[0];
  while (currentLevel.length > 1) {
    const nextLevel: Uint8Array[] = [];

    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || left; // Duplicate if odd number

      // Combine and hash
      const combined = new Uint8Array(64);
      combined.set(left, 0);
      combined.set(right, 32);
      nextLevel.push(doubleSha256(combined));
    }

    tree.push(nextLevel);
    currentLevel = nextLevel;
  }

  return tree;
}

// Get Merkle root (top of tree)
function getMerkleRoot(tree: Uint8Array[][]): Uint8Array {
  return tree[tree.length - 1][0];
}

// Generate Merkle proof for a leaf
function generateMerkleProof(tree: Uint8Array[][], leafIndex: number): { hash: Uint8Array; position: 'left' | 'right' }[] {
  const proof: { hash: Uint8Array; position: 'left' | 'right' }[] = [];
  let index = leafIndex;

  for (let level = 0; level < tree.length - 1; level++) {
    const isRightNode = index % 2 === 1;
    const siblingIndex = isRightNode ? index - 1 : index + 1;

    if (siblingIndex < tree[level].length) {
      proof.push({
        hash: tree[level][siblingIndex],
        position: isRightNode ? 'left' : 'right',
      });
    }

    index = Math.floor(index / 2);
  }

  return proof;
}

// Verify Merkle proof
function verifyMerkleProof(
  leaf: Uint8Array,
  proof: { hash: Uint8Array; position: 'left' | 'right' }[],
  root: Uint8Array
): boolean {
  let hash = doubleSha256(leaf);

  for (const { hash: siblingHash, position } of proof) {
    const combined = new Uint8Array(64);
    if (position === 'left') {
      combined.set(siblingHash, 0);
      combined.set(hash, 32);
    } else {
      combined.set(hash, 0);
      combined.set(siblingHash, 32);
    }
    hash = doubleSha256(combined);
  }

  return SHA256.toHex(hash) === SHA256.toHex(root);
}

// Example 1: Build simple Merkle tree
console.log('1. Building Merkle Tree');
console.log('-'.repeat(70));

const leaves = [
  new TextEncoder().encode('Transaction 1'),
  new TextEncoder().encode('Transaction 2'),
  new TextEncoder().encode('Transaction 3'),
  new TextEncoder().encode('Transaction 4'),
];

console.log('Building tree from', leaves.length, 'leaves:\n');
leaves.forEach((leaf, i) => {
  console.log(`  Leaf ${i}: "${new TextDecoder().decode(leaf)}"`);
});
console.log();

const tree = buildMerkleTree(leaves);
const root = getMerkleRoot(tree);

console.log('Tree structure:');
for (let level = tree.length - 1; level >= 0; level--) {
  const indent = ' '.repeat(level * 2);
  console.log(`Level ${tree.length - 1 - level}:${indent}`, tree[level].length, 'nodes');
}
console.log();
console.log('Merkle Root:', SHA256.toHex(root));
console.log();

// Example 2: Merkle proof generation and verification
console.log('2. Merkle Proof Generation and Verification');
console.log('-'.repeat(70));

const leafIndex = 2; // Prove "Transaction 3"
const leaf = leaves[leafIndex];

console.log(`Generating proof for leaf ${leafIndex}: "${new TextDecoder().decode(leaf)}"\n`);

const proof = generateMerkleProof(tree, leafIndex);

console.log('Proof path:');
proof.forEach((step, i) => {
  console.log(`  Step ${i + 1}: ${step.position.padEnd(5)} 0x${SHA256.toHex(step.hash).slice(2, 18)}...`);
});
console.log();

const isValid = verifyMerkleProof(leaf, proof, root);
console.log('Proof verification:', isValid ? '✓ VALID' : '✗ INVALID');
console.log();

// Tamper with leaf
const tamperedLeaf = new TextEncoder().encode('Transaction 3 (modified)');
const tamperedValid = verifyMerkleProof(tamperedLeaf, proof, root);
console.log('Tampered leaf verification:', tamperedValid ? '✓ VALID' : '✗ INVALID');
console.log();

// Example 3: Odd number of leaves
console.log('3. Merkle Tree with Odd Number of Leaves');
console.log('-'.repeat(70));

const oddLeaves = [
  new TextEncoder().encode('TX 1'),
  new TextEncoder().encode('TX 2'),
  new TextEncoder().encode('TX 3'),
  new TextEncoder().encode('TX 4'),
  new TextEncoder().encode('TX 5'),
];

console.log('Building tree from', oddLeaves.length, 'leaves (odd number)');
console.log('Last node will be duplicated at each level\n');

const oddTree = buildMerkleTree(oddLeaves);
const oddRoot = getMerkleRoot(oddTree);

for (let level = 0; level < oddTree.length; level++) {
  console.log(`Level ${level}:`, oddTree[level].length, 'nodes');
}
console.log();
console.log('Merkle Root:', SHA256.toHex(oddRoot));
console.log();

// Example 4: Large tree (simulated Bitcoin block)
console.log('4. Large Merkle Tree (Simulated Bitcoin Block)');
console.log('-'.repeat(70));

const txCount = 1000;
const largeTxs: Uint8Array[] = [];

for (let i = 0; i < txCount; i++) {
  const tx = new TextEncoder().encode(`Transaction ${i}`);
  largeTxs.push(tx);
}

console.log(`Building Merkle tree for ${txCount} transactions...\n`);

const start = performance.now();
const largeTree = buildMerkleTree(largeTxs);
const largeRoot = getMerkleRoot(largeTree);
const elapsed = performance.now() - start;

console.log('Tree levels:', largeTree.length);
console.log('Merkle root:', SHA256.toHex(largeRoot));
console.log('Build time:', elapsed.toFixed(2), 'ms');
console.log();

// Proof size scales logarithmically
const proofIndex = 500;
const largeProof = generateMerkleProof(largeTree, proofIndex);
console.log('Proof size for transaction', proofIndex, ':', largeProof.length, 'hashes');
console.log('Proof size scales O(log n) - for 1000 txs, only', largeProof.length, 'hashes needed!');
console.log();

// Example 5: Merkle tree efficiency comparison
console.log('5. Efficiency Analysis');
console.log('-'.repeat(70));

const sizes = [10, 100, 1000, 10000];

console.log('Transaction Count | Tree Levels | Proof Size | Space Savings');
console.log('-'.repeat(70));

for (const size of sizes) {
  const txs = Array.from({ length: size }, (_, i) =>
    new TextEncoder().encode(`TX ${i}`)
  );
  const t = buildMerkleTree(txs);
  const p = generateMerkleProof(t, 0);

  const withoutMerkle = size * 32; // All hashes
  const withMerkle = p.length * 32; // Only proof hashes
  const savings = ((1 - withMerkle / withoutMerkle) * 100).toFixed(1);

  console.log(
    `${size.toString().padStart(17)} | ${t.length.toString().padStart(11)} | ${p.length.toString().padStart(10)} | ${savings.padStart(13)}%`
  );
}
console.log();

// Example 6: Merkle tree visualization (small tree)
console.log('6. Merkle Tree Visualization');
console.log('-'.repeat(70));

const smallLeaves = [
  new TextEncoder().encode('A'),
  new TextEncoder().encode('B'),
  new TextEncoder().encode('C'),
  new TextEncoder().encode('D'),
];

const smallTree = buildMerkleTree(smallLeaves);

console.log('Tree structure:\n');
console.log('                Root');
console.log('                 |');
console.log('         +-------+-------+');
console.log('         |               |');
console.log('       Hash1           Hash2');
console.log('       /   \\           /   \\');
console.log('      /     \\         /     \\');
console.log('     A       B       C       D');
console.log();

for (let level = smallTree.length - 1; level >= 0; level--) {
  console.log(`Level ${smallTree.length - 1 - level}:`);
  smallTree[level].forEach((hash, i) => {
    console.log(`  Node ${i}: 0x${SHA256.toHex(hash).slice(2, 18)}...`);
  });
  console.log();
}

console.log('=== Merkle Tree Complete ===');
