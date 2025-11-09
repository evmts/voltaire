import { Ripemd160 } from '../../../src/crypto/Ripemd160/index.js';
import { SHA256 } from '../../../src/crypto/SHA256/index.js';
import { Blake2 } from '../../../src/crypto/Blake2/index.js';
import { Hex } from '../../../src/primitives/Hex/index.js';

/**
 * RIPEMD160 Legacy Comparison
 *
 * Demonstrates why RIPEMD160 is considered legacy:
 * - Comparison with modern alternatives
 * - Security margin differences
 * - Performance characteristics
 * - When to use (Bitcoin only) vs when to avoid
 */

console.log('=== RIPEMD160 Legacy Comparison ===\n');

// 1. Output size comparison
console.log('1. Output Size Comparison');
console.log('-'.repeat(40));

const testData = new TextEncoder().encode('Test data for hashing');

const ripemd160Hash = Ripemd160.hash(testData);
const sha256Hash = SHA256.hash(testData);
const blake2Hash = Blake2.hash(testData, 20); // Same size as RIPEMD160
const blake2StandardHash = Blake2.hash(testData, 32); // Standard size

console.log('Same input, different hash functions:\n');
console.log(`Input: "${new TextDecoder().decode(testData)}"`);
console.log(`\nRIPEMD160 (20 bytes):  ${Hex.fromBytes(ripemd160Hash)}`);
console.log(`SHA-256 (32 bytes):    ${Hex.fromBytes(sha256Hash)}`);
console.log(`Blake2-160 (20 bytes): ${Hex.fromBytes(blake2Hash)}`);
console.log(`Blake2-256 (32 bytes): ${Hex.fromBytes(blake2StandardHash)}`);

console.log('\nOutput size implications:');
console.log('- 160 bits = ~80-bit collision security (birthday bound)');
console.log('- 256 bits = ~128-bit collision security');
console.log('- Larger output = stronger security margin\n');

// 2. Security comparison
console.log('2. Security Comparison');
console.log('-'.repeat(40));

console.log('Algorithm security levels:\n');

console.log('RIPEMD160 (1996):');
console.log('  Output: 160 bits');
console.log('  Collision: ~2^80 operations');
console.log('  Preimage: ~2^160 operations');
console.log('  Status: No practical attacks, but limited security margin');

console.log('\nSHA-256 (2001):');
console.log('  Output: 256 bits');
console.log('  Collision: ~2^128 operations');
console.log('  Preimage: ~2^256 operations');
console.log('  Status: NIST standard, well-analyzed, strong security margin');

console.log('\nBlake2b (2012):');
console.log('  Output: 1-64 bytes (variable)');
console.log('  Collision: Depends on output size');
console.log('  Preimage: Up to ~2^512 operations');
console.log('  Status: Modern, faster than SHA-256, good security margin\n');

// 3. Bitcoin's choice: Why RIPEMD160?
console.log('3. Bitcoin\'s Historical Choice');
console.log('-'.repeat(40));

console.log('Why Bitcoin uses SHA-256 + RIPEMD160:\n');

console.log('1. Redundancy (2009 design):');
console.log('   - SHA-256: NIST standard (government trust)');
console.log('   - RIPEMD160: Independent European design');
console.log('   - Hedge against algorithm weakness');

console.log('\n2. Compact addresses:');
console.log('   - 20 bytes vs 32 bytes (37.5% smaller)');
console.log('   - Smaller QR codes');
console.log('   - Less blockchain storage');

console.log('\n3. Algorithm diversity:');
console.log('   - Different design principles');
console.log('   - Both must be broken for collision');
console.log('   - Conservative security approach');

console.log('\n4. 2009 context:');
console.log('   - SHA-256 was relatively new (2001)');
console.log('   - RIPEMD160 was proven (1996)');
console.log('   - No modern alternatives (Blake2 came in 2012)\n');

// 4. Modern alternatives
console.log('4. Modern Alternatives to RIPEMD160');
console.log('-'.repeat(40));

const sampleMessage = 'Modern cryptographic hash';
const sampleBytes = new TextEncoder().encode(sampleMessage);

console.log(`Hashing: "${sampleMessage}"\n`);

// RIPEMD160 (legacy)
const ripemd = Ripemd160.hash(sampleBytes);
console.log('Legacy option:');
console.log(`RIPEMD160:     ${Hex.fromBytes(ripemd)}`);
console.log('               ↑ 20 bytes, 1996 design, legacy status\n');

// Blake2 with 20-byte output (modern, fast)
const blake20 = Blake2.hash(sampleBytes, 20);
console.log('Modern alternatives for 20-byte output:');
console.log(`Blake2-160:    ${Hex.fromBytes(blake20)}`);
console.log('               ↑ 20 bytes, 2012 design, 2-3x faster\n');

// SHA-256 (standard)
const sha = SHA256.hash(sampleBytes);
console.log('Standard option:');
console.log(`SHA-256:       ${Hex.fromBytes(sha)}`);
console.log('               ↑ 32 bytes, NIST standard, widely supported\n');

// Blake2 with 32-byte output (modern, fast, standard size)
const blake32 = Blake2.hash(sampleBytes, 32);
console.log('Modern standard:');
console.log(`Blake2-256:    ${Hex.fromBytes(blake32)}`);
console.log('               ↑ 32 bytes, modern design, fastest\n');

// 5. Performance comparison
console.log('5. Performance Characteristics');
console.log('-'.repeat(40));

console.log('Typical software performance (approximate):\n');

console.log('RIPEMD160: ~150-250 MB/s');
console.log('  - Slower than modern alternatives');
console.log('  - No hardware acceleration');
console.log('  - Pure software implementation\n');

console.log('SHA-256: ~400 MB/s (software), ~3 GB/s (hardware)');
console.log('  - Moderate software speed');
console.log('  - Excellent with SHA-NI instruction set');
console.log('  - Widely optimized\n');

console.log('Blake2b: ~700 MB/s');
console.log('  - Fastest in software');
console.log('  - 2-3x faster than SHA-256 (software)');
console.log('  - No hardware acceleration (yet)\n');

// 6. When to use RIPEMD160 (Bitcoin only)
console.log('6. When to Use RIPEMD160');
console.log('-'.repeat(40));

console.log('✓ Use RIPEMD160 for:\n');
console.log('1. Bitcoin address derivation (required):');
console.log('   - P2PKH addresses (1...)');
console.log('   - P2SH addresses (3...)');
console.log('   - Legacy wallet compatibility');

console.log('\n2. Bitcoin script verification:');
console.log('   - OP_HASH160 operation');
console.log('   - Historical transaction verification');

console.log('\n✗ DO NOT use RIPEMD160 for:\n');
console.log('1. New cryptocurrency designs');
console.log('   → Use SHA-256, Keccak-256, or Blake2');

console.log('\n2. General-purpose hashing');
console.log('   → Use SHA-256 (standard) or Blake2 (fast)');

console.log('\n3. Password hashing');
console.log('   → Use Argon2, scrypt, or bcrypt');

console.log('\n4. File integrity checking');
console.log('   → Use SHA-256 (widely supported)\n');

// 7. Migration from RIPEMD160
console.log('7. Migrating Away from RIPEMD160');
console.log('-'.repeat(40));

console.log('For new projects, migration path:\n');

console.log('Replace RIPEMD160 with:\n');

console.log('Option 1: SHA-256 (most compatible)');
console.log('  Pros: NIST standard, hardware support, universal');
console.log('  Cons: Slower in software than Blake2');

console.log('\nOption 2: Blake2 (best performance)');
console.log('  Pros: Fastest, flexible output, modern');
console.log('  Cons: Less widespread, no hardware acceleration');

console.log('\nOption 3: Keep SHA-256 + RIPEMD160 (Bitcoin-like)');
console.log('  Pros: Defense in depth, compact output');
console.log('  Cons: Slower, legacy algorithm, complexity\n');

// 8. Double hashing pattern
console.log('8. Double Hashing Pattern (Bitcoin Style)');
console.log('-'.repeat(40));

const publicKeyExample = new Uint8Array(65).fill(0x04);

// Bitcoin's Hash160 = RIPEMD160(SHA256(data))
const step1 = SHA256.hash(publicKeyExample);
const hash160 = Ripemd160.hash(step1);

console.log('Bitcoin Hash160 pattern:');
console.log(`1. SHA-256:   ${Hex.fromBytes(step1)}`);
console.log(`2. RIPEMD160: ${Hex.fromBytes(hash160)}`);
console.log(`   Final: 20-byte address hash`);

console.log('\nModern equivalent with Blake2:');
const modernStep1 = Blake2.hash(publicKeyExample, 32);
const modernStep2 = Blake2.hash(modernStep1, 20);

console.log(`1. Blake2-256: ${Hex.fromBytes(modernStep1)}`);
console.log(`2. Blake2-160: ${Hex.fromBytes(modernStep2)}`);
console.log('   (Hypothetical - NOT Bitcoin compatible!)\n');

// 9. Why Bitcoin won't change
console.log('9. Why Bitcoin Remains with RIPEMD160');
console.log('-'.repeat(40));

console.log('Bitcoin is stuck with RIPEMD160 because:\n');

console.log('1. Backward compatibility:');
console.log('   - Billions of dollars in legacy addresses');
console.log('   - Cannot break existing wallets');
console.log('   - P2PKH/P2SH must remain valid');

console.log('\n2. Consensus rules:');
console.log('   - Hash160 is part of consensus');
console.log('   - Changing would require hard fork');
console.log('   - Too risky for security assumption change');

console.log('\n3. No urgent need:');
console.log('   - RIPEMD160 is not broken');
console.log('   - Combined with SHA-256 is secure');
console.log('   - "Don\'t fix what isn\'t broken"');

console.log('\n4. Modern alternatives exist:');
console.log('   - SegWit uses SHA-256 only');
console.log('   - Taproot uses different scheme');
console.log('   - New address types can avoid RIPEMD160\n');

console.log('=== Complete ===');
