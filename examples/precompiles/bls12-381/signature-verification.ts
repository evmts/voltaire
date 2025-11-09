import { execute, PrecompileAddress } from '../../../src/precompiles/precompiles.js';
import { Hardfork } from '../../../src/primitives/Hardfork/index.js';

/**
 * BLS12-381 Precompiles - BLS Signature Verification
 *
 * Demonstrates BLS signature scheme using BLS12-381 precompiles:
 * - 0x0C: G1_MUL - Derive public key
 * - 0x13: MAP_FP2_TO_G2 - Hash message to G2
 * - 0x0F: G2_MUL - Sign message
 * - 0x11: PAIRING - Verify signature
 *
 * BLS signatures are used in Ethereum 2.0 consensus for:
 * - Validator signatures
 * - Signature aggregation (1000s of signatures → 96 bytes)
 * - Threshold signatures
 *
 * Verification equation: e(PK, H(m)) = e(G1, sig)
 * Rearranged: e(PK, H(m)) × e(-G1, sig) = 1
 *
 * Gas costs:
 * - Hash to G2: 75,000 gas
 * - Pairing (2 pairs): 65,000 + 2×43,000 = 151,000 gas
 * - Total: ~226,000 gas per signature
 */

console.log('=== BLS12-381 - BLS Signature Verification ===\n');

/**
 * Convert bigint to bytes (big-endian, padded to length)
 */
function toBytes(value: bigint, length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[length - 1 - i] = Number((value >> BigInt(i * 8)) & 0xffn);
  }
  return bytes;
}

/**
 * Simple hash function for demonstration
 * Real impl would use proper hash-to-field from RFC 9380
 */
function hashToFp2(message: Uint8Array): Uint8Array {
  const fp2 = new Uint8Array(128); // Two 64-byte field elements

  // Component 0 (bytes 0-63)
  for (let i = 0; i < 32; i++) {
    fp2[32 + i] = message[i % message.length] ^ (i * 7);
  }

  // Component 1 (bytes 64-127)
  for (let i = 0; i < 32; i++) {
    fp2[96 + i] = message[i % message.length] ^ (i * 13);
  }

  return fp2;
}

// BLS12-381 G1 generator (simplified coordinates)
// Real coordinates are much larger
const G1_GENERATOR = new Uint8Array(128);
// Set generator point bytes (simplified)
G1_GENERATOR[63] = 0x01; // x = 1
G1_GENERATOR[127] = 0x02; // y = 2

// Example 1: Derive public key from secret key
console.log('1. Public Key Derivation');
console.log('-'.repeat(50));

const secretKey = 12345678901234567890n;
console.log(`Secret key: ${secretKey}\n`);

// PK = sk × G1
const pkInput = new Uint8Array(160);
pkInput.set(G1_GENERATOR, 0); // G1 point (128 bytes)
pkInput.set(toBytes(secretKey, 32), 128); // Scalar (32 bytes)

console.log('Computing PK = sk × G1...');
console.log(`Input: 160 bytes (G1 point + scalar)`);

const pkResult = execute(
  PrecompileAddress.BLS12_G1_MUL,
  pkInput,
  15000n,
  Hardfork.PRAGUE
);

if (pkResult.success) {
  console.log(`✓ Success`);
  console.log(`Gas used: ${pkResult.gasUsed}`);
  console.log(`Public key: 128 bytes (G1 point)\n`);

  const publicKey = pkResult.output;

  // Example 2: Hash message to G2
  console.log('2. Hash Message to G2');
  console.log('-'.repeat(50));

  const message = new TextEncoder().encode('Hello, BLS12-381!');
  console.log(`Message: "${new TextDecoder().decode(message)}"`);
  console.log(`Length: ${message.length} bytes\n`);

  // Hash to Fp2
  const fp2Element = hashToFp2(message);
  console.log('Hashing to Fp2 element...');

  // Map Fp2 to G2
  const mapResult = execute(
    PrecompileAddress.BLS12_MAP_FP2_TO_G2,
    fp2Element,
    80000n,
    Hardfork.PRAGUE
  );

  if (mapResult.success) {
    console.log(`✓ Success`);
    console.log(`Gas used: ${mapResult.gasUsed}`);
    console.log(`H(m): 256 bytes (G2 point)\n`);

    const messageHash = mapResult.output;

    // Example 3: Sign message
    console.log('3. Sign Message');
    console.log('-'.repeat(50));

    // Signature = sk × H(m)
    const signInput = new Uint8Array(288);
    signInput.set(messageHash, 0); // G2 point (256 bytes)
    signInput.set(toBytes(secretKey, 32), 256); // Scalar (32 bytes)

    console.log('Computing sig = sk × H(m)...');
    console.log(`Input: 288 bytes (G2 point + scalar)`);

    const signResult = execute(
      PrecompileAddress.BLS12_G2_MUL,
      signInput,
      50000n,
      Hardfork.PRAGUE
    );

    if (signResult.success) {
      console.log(`✓ Success`);
      console.log(`Gas used: ${signResult.gasUsed}`);
      console.log(`Signature: 256 bytes (G2 point)\n`);

      const signature = signResult.output;

      // Example 4: Verify signature
      console.log('4. Verify Signature');
      console.log('-'.repeat(50));

      console.log('Verification equation:');
      console.log('  e(PK, H(m)) = e(G1, sig)');
      console.log('  Rearranged: e(PK, H(m)) × e(-G1, sig) = 1\n');

      // Negate G1 generator (flip y-coordinate)
      const negG1 = new Uint8Array(G1_GENERATOR);
      // In real implementation, would flip y-coordinate
      // Simplified here

      // Build pairing input: 2 pairs (768 bytes)
      const pairingInput = new Uint8Array(768);

      // Pair 1: (PK, H(m))
      pairingInput.set(publicKey, 0); // G1 point (128 bytes)
      pairingInput.set(messageHash, 128); // G2 point (256 bytes)

      // Pair 2: (-G1, sig)
      pairingInput.set(negG1, 384); // G1 point (128 bytes)
      pairingInput.set(signature, 512); // G2 point (256 bytes)

      console.log('Pairing check: 2 pairs (768 bytes)');
      console.log('  Pair 1: (PK, H(m))');
      console.log('  Pair 2: (-G1, sig)\n');

      const verifyResult = execute(
        PrecompileAddress.BLS12_PAIRING,
        pairingInput,
        200000n,
        Hardfork.PRAGUE
      );

      if (verifyResult.success) {
        const isValid = verifyResult.output[31] === 1;
        console.log(`✓ Pairing executed`);
        console.log(`Gas used: ${verifyResult.gasUsed}`);
        console.log(`Expected: 65,000 + 2×43,000 = 151,000 gas`);
        console.log(`Signature valid: ${isValid ? 'YES' : 'NO'}\n`);
      } else {
        console.log(`✗ Verification failed: ${verifyResult.error}\n`);
      }

      // Example 5: Gas cost breakdown
      console.log('5. Gas Cost Breakdown');
      console.log('-'.repeat(50));

      console.log('Complete workflow:');
      const totalGas =
        (pkResult.gasUsed || 0n) +
        (mapResult.gasUsed || 0n) +
        (signResult.gasUsed || 0n) +
        (verifyResult.gasUsed || 0n);

      console.log(`  1. Public key derivation (G1_MUL):     ${pkResult.gasUsed} gas`);
      console.log(`  2. Hash to G2 (MAP_FP2_TO_G2):         ${mapResult.gasUsed} gas`);
      console.log(`  3. Sign message (G2_MUL):              ${signResult.gasUsed} gas`);
      console.log(`  4. Verify signature (PAIRING):         ${verifyResult.gasUsed} gas`);
      console.log(`  Total:                                 ${totalGas} gas\n`);

      console.log('Typical usage (verification only):');
      console.log(`  Hash to G2:    ${mapResult.gasUsed} gas`);
      console.log(`  Pairing check: ${verifyResult.gasUsed} gas`);
      console.log(`  Total:         ${(mapResult.gasUsed || 0n) + (verifyResult.gasUsed || 0n)} gas\n`);
    }
  }
}

// Example 6: Signature aggregation (conceptual)
console.log('6. Signature Aggregation (Conceptual)');
console.log('-'.repeat(50));

console.log('BLS signature aggregation magic:');
console.log('  Given N signatures: sig₁, sig₂, ..., sigₙ');
console.log('  Aggregate: sig_agg = sig₁ + sig₂ + ... + sigₙ\n');

console.log('Verification:');
console.log('  Single aggregate signature (96 bytes)');
console.log('  Verifies all N signatures in one pairing');
console.log('  Gas: Same as single signature (~226k)\n');

const NUM_VALIDATORS = 1000;
console.log(`Example: ${NUM_VALIDATORS} Ethereum validators\n`);

console.log('Without aggregation:');
console.log(`  Size: ${NUM_VALIDATORS} × 96 bytes = ${NUM_VALIDATORS * 96} bytes`);
console.log(`  Gas: ${NUM_VALIDATORS} × 226k = ${NUM_VALIDATORS * 226000} gas\n`);

console.log('With aggregation (BLS12-381):');
console.log(`  Size: 96 bytes (constant!)`);
console.log(`  Gas: ~226,000 gas (constant!)`);
console.log(`  Savings: ${((1 - 226000 / (NUM_VALIDATORS * 226000)) * 100).toFixed(1)}%\n`);

// Example 7: Ethereum 2.0 beacon chain usage
console.log('7. Ethereum 2.0 Beacon Chain Usage');
console.log('-'.repeat(50));

console.log('Validator attestations:');
console.log('  - Each epoch: ~10,000 validator attestations');
console.log('  - Aggregate into single 96-byte signature');
console.log('  - Broadcast: 96 bytes instead of ~1 MB');
console.log('  - Verify: 1 pairing check\n');

console.log('Block proposals:');
console.log('  - Proposer signs block');
console.log('  - BLS signature (96 bytes)');
console.log('  - Verified by all validators\n');

console.log('Sync committees:');
console.log('  - 512 validators per sync committee');
console.log('  - Aggregate signatures for light clients');
console.log('  - Enables efficient light client sync\n');

// Example 8: Threshold signatures
console.log('8. Threshold Signatures (t-of-n)');
console.log('-'.repeat(50));

const N_PARTIES = 10;
const THRESHOLD = 7;

console.log(`Setup: ${N_PARTIES} parties, threshold ${THRESHOLD}\n`);

console.log('Key generation:');
console.log('  - Secret key split into N shares');
console.log('  - Any t shares can reconstruct');
console.log('  - Shares distributed to parties\n');

console.log('Signing:');
console.log('  - Collect signatures from t parties');
console.log('  - Combine into valid signature');
console.log('  - No key reconstruction needed\n');

console.log('Applications:');
console.log('  - Multisig wallets (7-of-10)');
console.log('  - Distributed custody');
console.log('  - DAO governance');
console.log('  - Validator key management\n');

// Example 9: Comparison to ECDSA
console.log('9. BLS vs ECDSA Comparison');
console.log('-'.repeat(50));

console.log('ECDSA (secp256k1):');
console.log('  Signature size: ~65 bytes (r, s, v)');
console.log('  Aggregation: Not possible');
console.log('  Verification gas: ~3,000 gas (ECRECOVER)');
console.log('  Used by: Bitcoin, Ethereum L1 txs\n');

console.log('BLS (BLS12-381):');
console.log('  Signature size: 96 bytes (G2 point)');
console.log('  Aggregation: Yes! (constant size)');
console.log('  Verification gas: ~226,000 gas');
console.log('  Used by: Ethereum 2.0, Filecoin, Zcash\n');

console.log('Tradeoffs:');
console.log('  BLS: Expensive single verify, amazing aggregation');
console.log('  ECDSA: Cheap verify, no aggregation');
console.log('  Choice: Depends on use case\n');

console.log('=== Complete ===\n');
console.log('Summary:');
console.log('- BLS signature: 96 bytes (G2 point)');
console.log('- Verification: ~226,000 gas');
console.log('- Aggregation: Constant size regardless of N');
console.log('- Powers Ethereum 2.0 consensus');
console.log('- Critical for validator scalability');
console.log('- Enables 1000+ validator attestations');
