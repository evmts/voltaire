/**
 * Data Availability Sampling Example
 *
 * Demonstrates:
 * - L2 rollup data availability workflow
 * - Random point sampling and verification
 * - Light client data availability checks
 * - Understanding DA guarantees
 */

import { KZG } from '../../../src/crypto/KZG/KZG.js';
import { SHA256 } from '../../../src/crypto/SHA256/index.js';
import * as Hex from '../../../src/primitives/Hex/index.js';

console.log('=== Data Availability Sampling ===\n');

// Initialize KZG
KZG.loadTrustedSetup();

// Step 1: L2 sequencer posts data
console.log('1. L2 Sequencer: Publishing Rollup Data');
console.log('-'.repeat(50));

// Simulate L2 batch
const rollupBatch = {
  batchNumber: 12345,
  transactions: 1500,
  compressedSize: 128 * 1024, // 128 KB
  stateRoot: '0x1234...5678',
};

console.log('L2 Batch:');
console.log('  Batch number:', rollupBatch.batchNumber);
console.log('  Transactions:', rollupBatch.transactions);
console.log('  Compressed size:', rollupBatch.compressedSize, 'bytes');
console.log('  State root:', rollupBatch.stateRoot);
console.log();

// Create blob from rollup data
const blob = KZG.generateRandomBlob(); // In reality: encode compressed batch
const commitment = KZG.blobToKzgCommitment(blob);
const versionedHash = (() => {
  const hash = SHA256.hash(commitment);
  hash[0] = 0x01;
  return hash;
})();

console.log('Publishing to L1:');
console.log('  Blob size:', blob.length, 'bytes');
console.log('  Commitment:', Hex.fromBytes(commitment).slice(0, 20) + '...');
console.log('  Versioned hash:', Hex.fromBytes(versionedHash));
console.log('  Status: ✓ Submitted to L1');
console.log();

// Step 2: Full nodes download and verify
console.log('2. Full Nodes: Download and Verify');
console.log('-'.repeat(50));

console.log('Full node workflow:');
console.log('  1. Download blob from consensus layer');
console.log('  2. Compute KZG commitment from blob');
console.log('  3. Verify commitment matches versioned hash');
console.log('  4. Store blob for 18-day availability window');
console.log();

// Verify commitment matches
const recomputedCommitment = KZG.blobToKzgCommitment(blob);
const commitmentMatches = recomputedCommitment.every((b, i) => b === commitment[i]);

console.log('Full node verification:');
console.log('  Downloaded blob: ✓');
console.log('  Recomputed commitment: ✓');
console.log('  Commitment matches:', commitmentMatches ? '✓ Yes' : '✗ No');
console.log('  Data available: ✓');
console.log();

// Step 3: Light client sampling
console.log('3. Light Client: Data Availability Sampling');
console.log('-'.repeat(50));

console.log('Light client strategy:');
console.log('  - Cannot download full 128 KB blob');
console.log('  - Samples random points via KZG proofs');
console.log('  - Verifies each sample against commitment');
console.log('  - Statistical confidence in data availability');
console.log();

// Generate random sample points
const NUM_SAMPLES = 5;
const samplePoints: Uint8Array[] = [];

console.log(`Generating ${NUM_SAMPLES} random sample points...`);
for (let i = 0; i < NUM_SAMPLES; i++) {
  const z = new Uint8Array(32);
  crypto.getRandomValues(z);
  z[0] = 0; // Ensure < BLS modulus
  samplePoints.push(z);
}
console.log();

// Step 4: Request proofs from full node
console.log('4. Requesting Proofs from Full Node');
console.log('-'.repeat(50));

const proofs: Array<{ z: Uint8Array; y: Uint8Array; proof: Uint8Array }> = [];

console.log('Light client requests proofs for sample points:');
for (let i = 0; i < NUM_SAMPLES; i++) {
  const z = samplePoints[i];
  const { proof, y } = KZG.computeKzgProof(blob, z);

  proofs.push({ z, y, proof });

  console.log(`  Sample ${i + 1}:`);
  console.log('    z:', Hex.fromBytes(z).slice(0, 16) + '...');
  console.log('    y:', Hex.fromBytes(y).slice(0, 16) + '...');
  console.log('    proof size:', proof.length, 'bytes');
}
console.log();

console.log('Data transferred to light client:');
console.log('  Commitment:', 48, 'bytes');
console.log('  Proofs:', NUM_SAMPLES * (32 + 48), 'bytes (z + proof)');
console.log('  Y values:', NUM_SAMPLES * 32, 'bytes');
console.log('  Total:', 48 + NUM_SAMPLES * (32 + 48 + 32), 'bytes');
console.log('  vs Full blob:', blob.length, 'bytes');
console.log('  Savings:', ((1 - (48 + NUM_SAMPLES * 112) / blob.length) * 100).toFixed(1) + '%');
console.log();

// Step 5: Light client verifies samples
console.log('5. Light Client: Verifying Samples');
console.log('-'.repeat(50));

let allValid = true;
console.log('Verifying each sample proof:');

for (let i = 0; i < proofs.length; i++) {
  const { z, y, proof } = proofs[i];
  const valid = KZG.verifyKzgProof(commitment, z, y, proof);

  console.log(`  Sample ${i + 1}: ${valid ? '✓' : '✗'}`);

  if (!valid) {
    allValid = false;
  }
}
console.log();

console.log('All samples valid:', allValid ? '✓ Yes' : '✗ No');
console.log('Data availability confidence:', allValid ? 'High' : 'Low');
console.log();

// Step 6: Understanding DA guarantees
console.log('6. Data Availability Guarantees');
console.log('-'.repeat(50));

console.log('What KZG proves:');
console.log('  ✓ Data exists (blob was published)');
console.log('  ✓ Commitment binds to specific data');
console.log('  ✓ Cannot change data after commitment');
console.log('  ✓ Samples prove polynomial evaluation');
console.log();

console.log('What KZG does NOT prove:');
console.log('  ✗ Data correctness (state transition validity)');
console.log('  ✗ Transaction ordering');
console.log('  ✗ Smart contract execution');
console.log('  → These require fraud/validity proofs');
console.log();

// Step 7: Attack scenarios
console.log('7. Attack Scenarios');
console.log('-'.repeat(50));

console.log('Scenario 1: Malicious sequencer withholds blob');
console.log('  - Commitment on-chain, but blob not published');
console.log('  - Light client cannot get valid proofs');
console.log('  - Full nodes detect missing blob');
console.log('  - L2 halts or falls back to L1 data');
console.log('  Result: ✓ Attack detected');
console.log();

console.log('Scenario 2: Sequencer provides fake proof');
console.log('  - Tries to fool light client with wrong y value');
const fakeY = new Uint8Array(32);
crypto.getRandomValues(fakeY);
fakeY[0] = 0;
const fakeValid = KZG.verifyKzgProof(commitment, samplePoints[0], fakeY, proofs[0].proof);
console.log('  - Fake proof verification:', fakeValid ? '✗ Passed (BAD)' : '✓ Failed (expected)');
console.log('  Result: ✓ Attack prevented by crypto');
console.log();

console.log('Scenario 3: Sequencer publishes invalid state transition');
console.log('  - Blob is available, but state transition wrong');
console.log('  - KZG proves DA, not correctness');
console.log('  - Requires fraud proof (optimistic) or validity proof (ZK)');
console.log('  Result: ✓ Caught by fraud/validity proof system');
console.log();

// Step 8: Sampling statistics
console.log('8. Sampling Statistics');
console.log('-'.repeat(50));

function calculateConfidence(numSamples: number): number {
  // Simplified: probability of detecting unavailable data
  // In reality, depends on erasure coding and Reed-Solomon properties
  return 1 - Math.pow(0.5, numSamples);
}

const confidenceLevels = [1, 5, 10, 20, 50];

console.log('Data availability confidence by sample count:');
for (const n of confidenceLevels) {
  const confidence = calculateConfidence(n);
  console.log(`  ${n.toString().padStart(2)} samples: ${(confidence * 100).toFixed(2)}%`);
}
console.log();

console.log('Trade-off:');
console.log('  More samples → Higher confidence');
console.log('  More samples → More bandwidth for light client');
console.log('  Typical: 5-10 samples for light clients');
console.log();

// Step 9: Full DA workflow
console.log('9. Complete DA Workflow');
console.log('-'.repeat(50));

console.log('Timeline:');
console.log();

console.log('Block N (blob published):');
console.log('  L2 → Publishes blob + commitment to L1');
console.log('  L1 → Includes blob transaction in block');
console.log('  Consensus → Stores blob in sidecar');
console.log('  Full nodes → Download and verify blob');
console.log();

console.log('Blocks N+1 to N+4096 (~18 days):');
console.log('  Full nodes → Store blob');
console.log('  Light clients → Sample on demand');
console.log('  Archive nodes → May keep longer');
console.log('  Challengers → Can submit fraud proofs');
console.log();

console.log('After block N+4096:');
console.log('  Consensus → Prunes blob (not commitment!)');
console.log('  Commitment → Remains in state forever');
console.log('  Historical access → Only via archive nodes');
console.log();

// Step 10: Production recommendations
console.log('10. Production Recommendations');
console.log('-'.repeat(50));

console.log('For L2 operators:');
console.log('  ✓ Publish blobs with every batch');
console.log('  ✓ Store blobs locally (don\'t rely on 18-day window)');
console.log('  ✓ Provide DA proof endpoints for light clients');
console.log('  ✓ Monitor blob inclusion and availability');
console.log();

console.log('For light clients:');
console.log('  ✓ Sample 5-10 random points per blob');
console.log('  ✓ Request proofs from multiple full nodes');
console.log('  ✓ Verify all samples before trusting DA');
console.log('  ✓ Fall back to L1 data if samples fail');
console.log();

console.log('For dapp developers:');
console.log('  ✓ Understand DA != correctness');
console.log('  ✓ Rely on fraud/validity proofs for correctness');
console.log('  ✓ Monitor L2 liveness and DA');
console.log('  ✓ Have escape hatch for DA failures');
console.log();

// Cleanup
KZG.freeTrustedSetup();

console.log('=== Key Takeaways ===');
console.log('- KZG enables efficient data availability sampling');
console.log('- Light clients verify DA without downloading full blob');
console.log('- Sample 5-10 random points for statistical confidence');
console.log('- DA proves existence, not correctness');
console.log('- Critical for L2 scaling and decentralization');
console.log('- Enables Proto-Danksharding vision');
