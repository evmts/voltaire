/**
 * SHA256 Streaming API Example
 *
 * Demonstrates incremental hashing for:
 * - Large files that don't fit in memory
 * - Data arriving in chunks
 * - Memory-efficient processing
 * - Progress tracking
 */

import { SHA256 } from '../../../src/crypto/sha256/SHA256.js';

console.log('=== SHA256 Streaming API ===\n');

// Example 1: Basic streaming vs one-shot
console.log('1. Streaming vs One-Shot Hashing');
console.log('-'.repeat(60));

const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

// One-shot hashing
const oneShotHash = SHA256.hash(data);
console.log('One-shot hash:', SHA256.toHex(oneShotHash));

// Streaming hashing (same result)
const hasher = SHA256.create();
hasher.update(new Uint8Array([1, 2, 3]));
hasher.update(new Uint8Array([4, 5, 6]));
hasher.update(new Uint8Array([7, 8, 9, 10]));
const streamHash = hasher.digest();
console.log('Stream hash:  ', SHA256.toHex(streamHash));
console.log('Results match:', SHA256.toHex(oneShotHash) === SHA256.toHex(streamHash));
console.log();

// Example 2: Chunk size independence
console.log('2. Chunk Size Independence');
console.log('-'.repeat(60));
console.log('Different chunk sizes produce identical hashes\n');

const testData = new Uint8Array(100);
for (let i = 0; i < 100; i++) {
  testData[i] = i & 0xFF;
}

// Various chunk sizes
const chunkSizes = [1, 7, 16, 32, 64, 100];
const hashes: string[] = [];

for (const chunkSize of chunkSizes) {
  const h = SHA256.create();
  for (let i = 0; i < testData.length; i += chunkSize) {
    const chunk = testData.slice(i, i + chunkSize);
    h.update(chunk);
  }
  const hash = h.digest();
  hashes.push(SHA256.toHex(hash));
  console.log(`Chunk size ${chunkSize.toString().padStart(3)}:`, SHA256.toHex(hash).slice(0, 20) + '...');
}

const allSame = hashes.every(h => h === hashes[0]);
console.log('\nAll hashes identical:', allSame);
console.log();

// Example 3: Simulated file hashing with progress
console.log('3. File Hashing with Progress Tracking');
console.log('-'.repeat(60));

function hashFileWithProgress(fileSize: number, chunkSize: number): Uint8Array {
  const hasher = SHA256.create();
  let processed = 0;

  console.log(`Hashing ${fileSize} bytes in ${chunkSize} byte chunks...\n`);

  while (processed < fileSize) {
    const remaining = fileSize - processed;
    const currentChunk = Math.min(chunkSize, remaining);

    // Simulate chunk data
    const chunk = new Uint8Array(currentChunk);
    for (let i = 0; i < currentChunk; i++) {
      chunk[i] = (processed + i) & 0xFF;
    }

    hasher.update(chunk);
    processed += currentChunk;

    // Report progress
    const progress = (processed / fileSize) * 100;
    if (processed === fileSize || processed % (chunkSize * 10) === 0) {
      console.log(`Progress: ${progress.toFixed(1)}% (${processed}/${fileSize} bytes)`);
    }
  }

  return hasher.digest();
}

const largeFileHash = hashFileWithProgress(1024 * 1024, 64 * 1024); // 1MB file, 64KB chunks
console.log('\nFinal hash:', SHA256.toHex(largeFileHash));
console.log();

// Example 4: Optimal chunk sizes
console.log('4. Optimal Chunk Sizes');
console.log('-'.repeat(60));
console.log('Block size:', SHA256.BLOCK_SIZE, 'bytes (internal processing unit)');
console.log('\nRecommended chunk sizes:');
console.log('  Minimum:  64 bytes (1 block)');
console.log('  Optimal:  16-64 KB (256-1024 blocks)');
console.log('  Maximum:  Limited by available memory');
console.log();

// Demonstrate block size alignment
const blockAlignedChunks = [
  SHA256.BLOCK_SIZE,           // 64 bytes
  SHA256.BLOCK_SIZE * 16,      // 1 KB
  SHA256.BLOCK_SIZE * 256,     // 16 KB
  SHA256.BLOCK_SIZE * 1024,    // 64 KB
];

console.log('Block-aligned chunk sizes:');
for (const size of blockAlignedChunks) {
  const blocks = size / SHA256.BLOCK_SIZE;
  console.log(`  ${size.toString().padStart(6)} bytes = ${blocks.toString().padStart(4)} blocks`);
}
console.log();

// Example 5: Multi-part message hashing
console.log('5. Multi-Part Message Hashing');
console.log('-'.repeat(60));

interface MessagePart {
  type: string;
  data: string;
}

function hashMultiPartMessage(parts: MessagePart[]): Uint8Array {
  const hasher = SHA256.create();

  console.log('Hashing multi-part message:\n');

  for (const part of parts) {
    const encoded = new TextEncoder().encode(part.data);
    hasher.update(encoded);
    console.log(`  Part (${part.type}): "${part.data}"`);
    console.log(`    Bytes: ${encoded.length}`);
  }

  return hasher.digest();
}

const multiPartMessage: MessagePart[] = [
  { type: 'header', data: 'Subject: Important Message' },
  { type: 'body', data: 'This is the message body.' },
  { type: 'footer', data: 'Sent from my device' },
];

const multiPartHash = hashMultiPartMessage(multiPartMessage);
console.log('\nMulti-part hash:', SHA256.toHex(multiPartHash));
console.log();

// Example 6: Streaming vs concatenation (memory comparison)
console.log('6. Memory Efficiency: Streaming vs Concatenation');
console.log('-'.repeat(60));

// Inefficient: Concatenate then hash
function inefficientHash(parts: Uint8Array[]): Uint8Array {
  const totalSize = parts.reduce((sum, part) => sum + part.length, 0);
  const combined = new Uint8Array(totalSize);
  let offset = 0;
  for (const part of parts) {
    combined.set(part, offset);
    offset += part.length;
  }
  return SHA256.hash(combined); // Single allocation of full size
}

// Efficient: Stream without concatenation
function efficientHash(parts: Uint8Array[]): Uint8Array {
  const hasher = SHA256.create();
  for (const part of parts) {
    hasher.update(part); // No concatenation needed
  }
  return hasher.digest();
}

const parts = [
  new Uint8Array([1, 2, 3]),
  new Uint8Array([4, 5, 6]),
  new Uint8Array([7, 8, 9]),
];

const hash1 = inefficientHash(parts);
const hash2 = efficientHash(parts);

console.log('Inefficient (concatenate): Allocates', parts.reduce((s, p) => s + p.length, 0), 'bytes');
console.log('Efficient (streaming):     Allocates 0 extra bytes');
console.log('Results match:', SHA256.toHex(hash1) === SHA256.toHex(hash2));
console.log();

// Example 7: Cannot reuse hasher after digest
console.log('7. Hasher Lifecycle');
console.log('-'.repeat(60));

const h = SHA256.create();
h.update(new Uint8Array([1, 2, 3]));
console.log('Updated with [1, 2, 3]');

const digest = h.digest();
console.log('Called digest():', SHA256.toHex(digest).slice(0, 20) + '...');

console.log('\nHasher is now finalized and cannot be reused');
console.log('For new hash, create new hasher instance:');
const newHasher = SHA256.create();
console.log('Created new hasher ✓');
console.log();

console.log('=== Streaming API Complete ===');
