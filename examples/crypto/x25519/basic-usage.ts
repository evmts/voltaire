/**
 * Basic X25519 Usage (ECDH Key Exchange)
 *
 * Demonstrates:
 * - Keypair generation
 * - Diffie-Hellman key exchange
 * - Shared secret computation
 * - Key validation
 * - Secure key derivation
 */

import * as X25519 from '../../../src/crypto/X25519/index.js';
import { Hex } from '../../../src/primitives/Hex/index.js';

console.log('=== Basic X25519 Usage (ECDH Key Exchange) ===\n');

// 1. Generate keypairs
console.log('1. Keypair Generation');
console.log('-'.repeat(40));

const aliceKeypair = X25519.generateKeypair();
const bobKeypair = X25519.generateKeypair();

console.log('Alice\'s keypair:');
console.log(`  Secret key: ${Hex.fromBytes(aliceKeypair.secretKey)}`);
console.log(`  Public key: ${Hex.fromBytes(aliceKeypair.publicKey)}`);

console.log('\nBob\'s keypair:');
console.log(`  Secret key: ${Hex.fromBytes(bobKeypair.secretKey)}`);
console.log(`  Public key: ${Hex.fromBytes(bobKeypair.publicKey)}\n`);

// 2. Diffie-Hellman key exchange
console.log('2. Diffie-Hellman Key Exchange');
console.log('-'.repeat(40));

// Alice computes shared secret using her secret key and Bob's public key
const aliceShared = X25519.scalarmult(aliceKeypair.secretKey, bobKeypair.publicKey);

// Bob computes shared secret using his secret key and Alice's public key
const bobShared = X25519.scalarmult(bobKeypair.secretKey, aliceKeypair.publicKey);

console.log('Alice\'s shared secret:');
console.log(`  ${Hex.fromBytes(aliceShared)}`);

console.log('\nBob\'s shared secret:');
console.log(`  ${Hex.fromBytes(bobShared)}`);

const secretsMatch = Hex.fromBytes(aliceShared) === Hex.fromBytes(bobShared);
console.log(`\nShared secrets match: ${secretsMatch ? '✓' : '✗'}`);

console.log('\n✓ Both parties computed same shared secret');
console.log('✓ Shared secret never transmitted over network\n');

// 3. Key validation
console.log('3. Key Validation');
console.log('-'.repeat(40));

const validSecretKey = aliceKeypair.secretKey;
const validPublicKey = aliceKeypair.publicKey;

console.log(`Valid secret key (32 bytes): ${X25519.validateSecretKey(validSecretKey) ? '✓' : '✗'}`);
console.log(`Valid public key (32 bytes): ${X25519.validatePublicKey(validPublicKey) ? '✓' : '✗'}`);

const invalidShort = new Uint8Array(16);
const invalidLong = new Uint8Array(64);

console.log(`\nInvalid short key (16 bytes): ${X25519.validateSecretKey(invalidShort) ? '✗ Accepted' : '✓ Rejected'}`);
console.log(`Invalid long key (64 bytes): ${X25519.validateSecretKey(invalidLong) ? '✗ Accepted' : '✓ Rejected'}\n`);

// 4. Derive public key from secret key
console.log('4. Public Key Derivation');
console.log('-'.repeat(40));

const secretKey = X25519.generateSecretKey();
const derivedPublicKey = X25519.derivePublicKey(secretKey);

console.log(`Secret key: ${Hex.fromBytes(secretKey)}`);
console.log(`Derived public key: ${Hex.fromBytes(derivedPublicKey)}`);

const isValid = X25519.validatePublicKey(derivedPublicKey);
console.log(`Valid public key: ${isValid ? '✓' : '✗'}\n`);

// 5. Deterministic keypair from seed
console.log('5. Deterministic Keypair from Seed');
console.log('-'.repeat(40));

const seed = new Uint8Array(32);
crypto.getRandomValues(seed);

const keypair1 = X25519.keypairFromSeed(seed);
const keypair2 = X25519.keypairFromSeed(seed);

console.log('Same seed produces identical keypairs:');
console.log(`Keypair 1 public: ${Hex.fromBytes(keypair1.publicKey).slice(0, 32)}...`);
console.log(`Keypair 2 public: ${Hex.fromBytes(keypair2.publicKey).slice(0, 32)}...`);

const publicKeysMatch = Hex.fromBytes(keypair1.publicKey) === Hex.fromBytes(keypair2.publicKey);
console.log(`Match: ${publicKeysMatch}\n`);

// 6. Multiple key exchanges
console.log('6. Multiple Parties Key Exchange');
console.log('-'.repeat(40));

const carol = X25519.generateKeypair();
const dave = X25519.generateKeypair();

console.log('Four parties (Alice, Bob, Carol, Dave):');
console.log(`  Alice: ${Hex.fromBytes(aliceKeypair.publicKey).slice(0, 24)}...`);
console.log(`  Bob:   ${Hex.fromBytes(bobKeypair.publicKey).slice(0, 24)}...`);
console.log(`  Carol: ${Hex.fromBytes(carol.publicKey).slice(0, 24)}...`);
console.log(`  Dave:  ${Hex.fromBytes(dave.publicKey).slice(0, 24)}...`);

console.log('\nPairwise shared secrets:');
const aliceCarol = X25519.scalarmult(aliceKeypair.secretKey, carol.publicKey);
const bobDave = X25519.scalarmult(bobKeypair.secretKey, dave.publicKey);

console.log(`  Alice-Carol: ${Hex.fromBytes(aliceCarol).slice(0, 24)}...`);
console.log(`  Bob-Dave:    ${Hex.fromBytes(bobDave).slice(0, 24)}...\n`);

// 7. Key size constants
console.log('7. X25519 Constants');
console.log('-'.repeat(40));

console.log(`SECRET_KEY_SIZE: ${X25519.SECRET_KEY_SIZE} bytes`);
console.log(`PUBLIC_KEY_SIZE: ${X25519.PUBLIC_KEY_SIZE} bytes`);
console.log(`SHARED_SECRET_SIZE: ${X25519.SHARED_SECRET_SIZE} bytes\n`);

// 8. Secure messaging example
console.log('8. Secure Messaging Flow');
console.log('-'.repeat(40));

console.log('Scenario: Alice sends encrypted message to Bob\n');

console.log('Step 1: Key exchange');
console.log('  Alice generates keypair (secret, public)');
console.log('  Bob generates keypair (secret, public)');
console.log('  Alice and Bob exchange public keys (insecure channel OK)');

console.log('\nStep 2: Compute shared secret');
const msgAliceShared = X25519.scalarmult(aliceKeypair.secretKey, bobKeypair.publicKey);
const msgBobShared = X25519.scalarmult(bobKeypair.secretKey, aliceKeypair.publicKey);
console.log(`  Alice: sharedSecret = X25519(alice.secret, bob.public)`);
console.log(`  Bob:   sharedSecret = X25519(bob.secret, alice.public)`);
console.log(`  Result: ${Hex.fromBytes(msgAliceShared).slice(0, 32)}...`);

console.log('\nStep 3: Derive encryption key (HKDF)');
console.log('  encryptionKey = HKDF(sharedSecret, salt, info)');
console.log('  (Use HKDF, not raw shared secret!)');

console.log('\nStep 4: Encrypt message');
console.log('  ciphertext = AES-GCM(message, encryptionKey, nonce)');

console.log('\nStep 5: Send to Bob');
console.log('  Send: alice.publicKey + nonce + ciphertext + tag');

console.log('\nStep 6: Bob decrypts');
console.log('  Bob computes same sharedSecret');
console.log('  Bob derives same encryptionKey');
console.log('  Bob decrypts ciphertext\n');

// 9. Important security notes
console.log('9. Security Warnings');
console.log('-'.repeat(40));

console.log('⚠️  CRITICAL: Never use raw shared secret directly!');
console.log('');
console.log('❌ WRONG:');
console.log('  const aesKey = sharedSecret; // DON\'T DO THIS');
console.log('');
console.log('✓ CORRECT:');
console.log('  import { hkdf } from \'@noble/hashes/hkdf\';');
console.log('  import { sha256 } from \'@noble/hashes/sha256\';');
console.log('  const derivedKey = hkdf(sha256, sharedSecret, salt, info, 32);');
console.log('');
console.log('Why?');
console.log('  • Raw X25519 output may have bias');
console.log('  • KDF ensures uniform distribution');
console.log('  • KDF allows deriving multiple keys from one secret');
console.log('  • KDF binds key to specific context (salt, info)\n');

// 10. Use cases
console.log('10. X25519 Use Cases');
console.log('-'.repeat(40));

console.log('Modern protocols using X25519:');
console.log('✓ TLS 1.3 - Web HTTPS connections');
console.log('✓ WireGuard - Fast VPN protocol');
console.log('✓ Signal - End-to-end encrypted messaging');
console.log('✓ WhatsApp - Message encryption');
console.log('✓ SSH - Secure shell connections');
console.log('✓ Tor - Onion routing key exchange');
console.log('✓ Age - Modern file encryption');
console.log('✓ Noise Protocol - Secure channel framework');

console.log('\nX25519 vs secp256k1 ECDH:');
console.log('  • X25519: ~2x faster, simpler, modern');
console.log('  • secp256k1: Ethereum-compatible, widely deployed');
console.log('  • Use X25519 for new applications');
console.log('  • Use secp256k1 for Ethereum compatibility\n');

console.log('=== Complete ===');
