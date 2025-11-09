import * as Ed25519 from '../../../src/crypto/Ed25519/index.js';
import { Hex } from '../../../src/primitives/Hex/index.js';

/**
 * Basic Ed25519 Usage
 *
 * Demonstrates fundamental Ed25519 operations:
 * - Keypair generation from seed
 * - Deterministic signing (no nonce needed)
 * - Signature verification
 * - Key validation
 * - Advantages over ECDSA
 */

console.log('=== Basic Ed25519 Usage ===\n');

// 1. Generate keypair from seed
console.log('1. Keypair Generation from Seed');
console.log('-'.repeat(40));

// Generate 32-byte seed (in production, use crypto.getRandomValues())
const seed = new Uint8Array(32);
crypto.getRandomValues(seed);

const keypair = Ed25519.keypairFromSeed(seed);

console.log(`Seed (32 bytes):       ${Hex.fromBytes(seed)}`);
console.log(`Secret key (32 bytes): ${Hex.fromBytes(keypair.secretKey)}`);
console.log(`Public key (32 bytes): ${Hex.fromBytes(keypair.publicKey)}`);

console.log('\nNote: Ed25519 secret key IS the seed');
console.log('No additional derivation needed\n');

// 2. Sign a message
console.log('2. Message Signing');
console.log('-'.repeat(40));

const message = new TextEncoder().encode('Hello, Ed25519!');

console.log(`Message: "${new TextDecoder().decode(message)}"`);
console.log(`Message bytes: ${message.length}`);

const signature = Ed25519.sign(message, keypair.secretKey);

console.log(`\nSignature (64 bytes): ${Hex.fromBytes(signature)}`);
console.log('Ed25519 signs the message directly (no pre-hashing needed)\n');

// 3. Verify signature
console.log('3. Signature Verification');
console.log('-'.repeat(40));

const isValid = Ed25519.verify(signature, message, keypair.publicKey);
console.log(`Signature valid: ${isValid}`);

// Wrong message fails
const wrongMessage = new TextEncoder().encode('Wrong message');
const isInvalid = Ed25519.verify(signature, wrongMessage, keypair.publicKey);
console.log(`Wrong message: ${isInvalid} (should be false)`);

// Wrong public key fails
const wrongSeed = new Uint8Array(32).fill(0x42);
const wrongKeypair = Ed25519.keypairFromSeed(wrongSeed);
const wrongKey = Ed25519.verify(signature, message, wrongKeypair.publicKey);
console.log(`Wrong public key: ${wrongKey} (should be false)\n`);

// 4. Deterministic signatures
console.log('4. Deterministic Signatures (Built-in)');
console.log('-'.repeat(40));

const testMessage = new TextEncoder().encode('test');

// Sign same message multiple times
const sig1 = Ed25519.sign(testMessage, keypair.secretKey);
const sig2 = Ed25519.sign(testMessage, keypair.secretKey);
const sig3 = Ed25519.sign(testMessage, keypair.secretKey);

console.log(`Message: "${new TextDecoder().decode(testMessage)}"`);
console.log(`Sig 1: ${Hex.fromBytes(sig1).slice(0, 40)}...`);
console.log(`Sig 2: ${Hex.fromBytes(sig2).slice(0, 40)}...`);
console.log(`Sig 3: ${Hex.fromBytes(sig3).slice(0, 40)}...`);

const allMatch = Hex.fromBytes(sig1) === Hex.fromBytes(sig2) &&
  Hex.fromBytes(sig2) === Hex.fromBytes(sig3);

console.log(`\nAll signatures identical: ${allMatch}`);
console.log('Ed25519 is deterministic by design (no random nonce)\n');

// 5. Variable message lengths
console.log('5. Variable Message Lengths');
console.log('-'.repeat(40));

// Empty message
const empty = new Uint8Array(0);
const sigEmpty = Ed25519.sign(empty, keypair.secretKey);
console.log(`Empty message (0 bytes):`);
console.log(`  Signature: ${Hex.fromBytes(sigEmpty).slice(0, 40)}...`);
console.log(`  Valid: ${Ed25519.verify(sigEmpty, empty, keypair.publicKey)}`);

// Short message
const short = new TextEncoder().encode('Hi');
const sigShort = Ed25519.sign(short, keypair.secretKey);
console.log(`\nShort message (${short.length} bytes): "${new TextDecoder().decode(short)}"`);
console.log(`  Signature: ${Hex.fromBytes(sigShort).slice(0, 40)}...`);
console.log(`  Valid: ${Ed25519.verify(sigShort, short, keypair.publicKey)}`);

// Long message
const long = new Uint8Array(10000).fill(0xAB);
const sigLong = Ed25519.sign(long, keypair.secretKey);
console.log(`\nLong message (${long.length} bytes):`);
console.log(`  Signature: ${Hex.fromBytes(sigLong).slice(0, 40)}...`);
console.log(`  Valid: ${Ed25519.verify(sigLong, long, keypair.publicKey)}`);

console.log('\nEd25519 handles any message length (no pre-hashing required)\n');

// 6. Key validation
console.log('6. Key Validation');
console.log('-'.repeat(40));

// Valid keys
console.log(`Valid secret key (32 bytes): ${Ed25519.validateSecretKey(keypair.secretKey)}`);
console.log(`Valid public key (32 bytes): ${Ed25519.validatePublicKey(keypair.publicKey)}`);
console.log(`Valid seed (32 bytes): ${Ed25519.validateSeed(seed)}`);

// Invalid keys
const invalidShort = new Uint8Array(16);
console.log(`\nInvalid short key (16 bytes): ${Ed25519.validateSecretKey(invalidShort)}`);

const invalidLong = new Uint8Array(64);
console.log(`Invalid long key (64 bytes): ${Ed25519.validateSecretKey(invalidLong)}\n`);

// 7. Public key derivation
console.log('7. Public Key Derivation');
console.log('-'.repeat(40));

const derivedPublicKey = Ed25519.derivePublicKey(keypair.secretKey);

console.log(`Original public key: ${Hex.fromBytes(keypair.publicKey)}`);
console.log(`Derived public key:  ${Hex.fromBytes(derivedPublicKey)}`);

const keysMatch = Hex.fromBytes(keypair.publicKey) === Hex.fromBytes(derivedPublicKey);
console.log(`\nKeys match: ${keysMatch}`);
console.log('Public key can be re-derived from secret key\n');

// 8. Multiple messages with same key
console.log('8. Multiple Messages with Same Key');
console.log('-'.repeat(40));

const messages = [
  'First message',
  'Second message',
  'Third message',
];

console.log('Signing multiple messages with same keypair:\n');

messages.forEach((msg, i) => {
  const msgBytes = new TextEncoder().encode(msg);
  const sig = Ed25519.sign(msgBytes, keypair.secretKey);
  const valid = Ed25519.verify(sig, msgBytes, keypair.publicKey);

  console.log(`Message ${i + 1}: "${msg}"`);
  console.log(`  Signature: ${Hex.fromBytes(sig).slice(0, 40)}...`);
  console.log(`  Valid: ${valid}\n`);
});

// 9. Ed25519 advantages over ECDSA
console.log('9. Ed25519 Advantages over ECDSA');
console.log('-'.repeat(40));

console.log('Security benefits:');
console.log('✓ No nonce generation (eliminates nonce reuse attacks)');
console.log('✓ No malleability (signatures cannot be modified)');
console.log('✓ No special cases (no low-s normalization needed)');
console.log('✓ Built-in determinism (same message = same signature)');

console.log('\nPerformance benefits:');
console.log('✓ 2-3x faster signing than secp256k1');
console.log('✓ 2-3x faster verification than secp256k1');
console.log('✓ Smaller public keys (32 bytes vs 64 bytes)');

console.log('\nImplementation benefits:');
console.log('✓ Simpler implementation (fewer edge cases)');
console.log('✓ Harder to implement incorrectly');
console.log('✓ Better resistance to side-channel attacks\n');

// 10. Use cases
console.log('10. Ed25519 Use Cases');
console.log('-'.repeat(40));

console.log('Modern protocols using Ed25519:');
console.log('• SSH (ssh-ed25519 key type)');
console.log('• TLS 1.3 (ed25519 signature algorithm)');
console.log('• Signal Protocol (Double Ratchet)');
console.log('• WireGuard VPN');
console.log('• Tor (onion service keys)');
console.log('• Zcash (Sapling/Orchard)');
console.log('• Monero (ring signatures)');
console.log('• Stellar (transaction signing)');
console.log('• Solana (account signatures)');
console.log('• StarkNet (account abstraction)\n');

console.log('=== Complete ===');
