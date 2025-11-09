/**
 * EIP-4844 Blob Transaction Example
 *
 * Demonstrates blob transactions for L2 data availability:
 * - Creating blob transactions
 * - Blob gas cost calculation
 * - Blob versioned hashes (KZG commitments)
 * - Cost comparison with calldata
 */

import * as Transaction from '../../../src/primitives/Transaction/index.js';
import * as Address from '../../../src/primitives/Address/index.js';
import * as Hex from '../../../src/primitives/Hex/index.js';
import * as Hash from '../../../src/primitives/Hash/index.js';

console.log('=== EIP-4844 Blob Transaction Examples ===\n');

// Example 1: Basic blob transaction
console.log('1. Basic Blob Transaction');
console.log('-'.repeat(50));

// Create blob versioned hashes (KZG commitments)
const blobHash1 = Hash.from('0x0100000000000000000000000000000000000000000000000000000000000001');
const blobHash2 = Hash.from('0x0100000000000000000000000000000000000000000000000000000000000002');

const blobTx: Transaction.EIP4844 = {
  type: Transaction.Type.EIP4844,
  chainId: 1n,
  nonce: 0n,
  maxPriorityFeePerGas: 1_000_000_000n,
  maxFeePerGas: 20_000_000_000n,
  gasLimit: 100_000n,
  to: Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e'),  // Cannot be null
  value: 0n,
  data: new Uint8Array(),
  accessList: [],
  maxFeePerBlobGas: 2_000_000_000n,  // 2 gwei per blob gas
  blobVersionedHashes: [blobHash1, blobHash2],  // 2 blobs
  yParity: 0,
  r: Hex.toBytes('0x' + '00'.repeat(32)),
  s: Hex.toBytes('0x' + '00'.repeat(32)),
};

console.log('Blob Transaction:');
console.log('  Type:', blobTx.type, '(EIP-4844)');
console.log('  Chain ID:', blobTx.chainId);
console.log('  To:', Address.toHex(blobTx.to));
console.log('  Max Fee Per Blob Gas:', blobTx.maxFeePerBlobGas / 1_000_000_000n, 'gwei');
console.log('  Blob Count:', Transaction.getBlobCount(blobTx));
console.log('  Blob Versioned Hashes:', Transaction.getBlobVersionedHashes(blobTx).length);
console.log();

// Example 2: Blob size and gas
console.log('2. Blob Size and Gas');
console.log('-'.repeat(50));

const BLOB_SIZE = 131_072n;  // 128 KB per blob
const BLOB_GAS_PER_BLOB = 131_072n;

console.log('Each Blob:');
console.log('  Size:', BLOB_SIZE, 'bytes (128 KB)');
console.log('  Gas:', BLOB_GAS_PER_BLOB, 'blob gas');
console.log();

console.log('This Transaction:');
const blobCount = Transaction.getBlobCount(blobTx);
const totalBlobSize = BLOB_SIZE * BigInt(blobCount);
const totalBlobGas = BLOB_GAS_PER_BLOB * BigInt(blobCount);

console.log('  Blobs:', blobCount);
console.log('  Total Size:', totalBlobSize, 'bytes', '(' + Number(totalBlobSize) / 1024 + ' KB)');
console.log('  Total Blob Gas:', totalBlobGas);
console.log();

console.log('Maximum Limits:');
console.log('  Max Blobs per TX: 6');
console.log('  Max Size per TX:', 6 * 131_072, 'bytes (768 KB)');
console.log('  Max Blob Gas per TX:', 6 * 131_072);
console.log();

// Example 3: Blob gas cost calculation
console.log('3. Blob Gas Cost Calculation');
console.log('-'.repeat(50));

const blobBaseFee = 1n;  // 1 wei per blob gas (example)
const blobGasCost = Transaction.EIP4844.getBlobGasCost(blobTx, blobBaseFee);

console.log('Blob Gas Pricing:');
console.log('  Blob Base Fee:', blobBaseFee, 'wei');
console.log('  Blob Count:', blobCount);
console.log('  Blob Gas Cost:', blobGasCost, 'wei');
console.log('  Formula: blob_count × 131,072 × blob_base_fee');
console.log('  Calculation:', blobCount, '× 131,072 ×', blobBaseFee, '=', blobGasCost);
console.log();

// Example 4: Total transaction cost
console.log('4. Total Transaction Cost');
console.log('-'.repeat(50));

const baseFee = 15_000_000_000n;  // Execution base fee
const gasUsed = 50_000n;

const executionGasPrice = Transaction.EIP4844.getEffectiveGasPrice(blobTx, baseFee);
const executionCost = executionGasPrice * gasUsed;
const totalCost = executionCost + blobGasCost + blobTx.value;

console.log('Execution Cost:');
console.log('  Base Fee:', baseFee / 1_000_000_000n, 'gwei');
console.log('  Gas Used:', gasUsed);
console.log('  Effective Gas Price:', executionGasPrice / 1_000_000_000n, 'gwei');
console.log('  Execution Cost:', executionCost, 'wei');
console.log();

console.log('Blob Cost:');
console.log('  Blob Base Fee:', blobBaseFee, 'wei');
console.log('  Blob Gas:', totalBlobGas);
console.log('  Blob Cost:', blobGasCost, 'wei');
console.log();

console.log('Total Transaction Cost:');
console.log('  Execution:', executionCost, 'wei');
console.log('  Blobs:', blobGasCost, 'wei');
console.log('  Value:', blobTx.value, 'wei');
console.log('  Total:', totalCost, 'wei');
console.log();

// Example 5: Blob vs calldata cost comparison
console.log('5. Blob vs Calldata Cost Comparison');
console.log('-'.repeat(50));

const dataSize = 131_072n;  // 128 KB

// Calldata cost (16 gas per byte)
const calldataGasPerByte = 16n;
const calldataGasCost = dataSize * calldataGasPerByte;
const calldataCostWei = calldataGasCost * baseFee;

// Blob cost (1 gas per byte, approximately)
const blobGasPerByte = 1n;
const blobGasCostForData = dataSize * blobGasPerByte * blobBaseFee;

console.log('For 128 KB of data:');
console.log();

console.log('Calldata:');
console.log('  Gas per byte: 16');
console.log('  Total gas:', calldataGasCost);
console.log('  Cost:', calldataCostWei, 'wei');
console.log('  Stored: Forever');
console.log();

console.log('Blobs:');
console.log('  Gas per byte: ~1');
console.log('  Total gas:', dataSize);
console.log('  Cost:', blobGasCostForData, 'wei');
console.log('  Stored: ~18 days');
console.log();

const savings = calldataCostWei - blobGasCostForData;
const savingsPercent = (Number(savings) / Number(calldataCostWei)) * 100;

console.log('Savings:');
console.log('  Wei saved:', savings);
console.log('  Percentage:', savingsPercent.toFixed(2) + '%');
console.log('  ~16x cheaper for L2 rollup data!');
console.log();

// Example 6: Blob versioned hashes
console.log('6. Blob Versioned Hashes (KZG Commitments)');
console.log('-'.repeat(50));

console.log('Versioned Hash Format:');
console.log('  Byte 0: Version (0x01 = SHA-256)');
console.log('  Bytes 1-31: sha256(kzg_commitment)[1:]');
console.log();

for (let i = 0; i < blobTx.blobVersionedHashes.length; i++) {
  const versionedHash = blobTx.blobVersionedHashes[i];
  const hashBytes = new Uint8Array(versionedHash);
  const version = hashBytes[0];

  console.log(`Blob ${i + 1}:`);
  console.log('  Hash:', Hex.fromBytes(versionedHash));
  console.log('  Version:', '0x' + version.toString(16).padStart(2, '0'));
  console.log('  Type:', version === 0x01 ? 'SHA-256' : 'Unknown');
  console.log();
}

// Example 7: Blob transaction limitations
console.log('7. Blob Transaction Limitations');
console.log('-'.repeat(50));

console.log('Restrictions:');
console.log('  ✗ to cannot be null (no contract creation)');
console.log('  ✗ Blob data pruned after ~18 days');
console.log('  ✗ Maximum 6 blobs per transaction');
console.log('  ✗ Requires Dencun hard fork');
console.log();

console.log('Best for:');
console.log('  ✓ L2 rollup data availability');
console.log('  ✓ Temporary large data (<768 KB)');
console.log('  ✓ Cost optimization vs calldata');
console.log();

// Example 8: Blob base fee market
console.log('8. Blob Base Fee Market');
console.log('-'.repeat(50));

console.log('Blob gas pricing (separate from execution gas):');
console.log('  Target: 3 blobs per block');
console.log('  Max: 6 blobs per block');
console.log();

const scenarios = [
  { blobs: 1, description: 'Low usage' },
  { blobs: 3, description: 'Target (equilibrium)' },
  { blobs: 5, description: 'High usage' },
  { blobs: 6, description: 'Maximum' },
];

console.log('Fee Adjustment:');
for (const scenario of scenarios) {
  const adjustment = scenario.blobs < 3 ? '↓ Decrease' : scenario.blobs > 3 ? '↑ Increase' : '→ Stable';
  console.log(`  ${scenario.blobs} blobs: ${adjustment} (${scenario.description})`);
}
console.log();

console.log('Independent Markets:');
console.log('  executionBaseFee - For regular gas (EIP-1559)');
console.log('  blobBaseFee - For blob gas (EIP-4844)');
console.log('  Each adjusts based on its own usage');
