import * as P256 from '../../../src/crypto/P256/index.js';
import * as Hash from '../../../src/primitives/Hash/index.js';
import { Hex } from '../../../src/primitives/Hex/index.js';

/**
 * Basic P-256 (secp256r1) Usage
 *
 * Demonstrates fundamental P-256 elliptic curve operations:
 * - Key generation and derivation
 * - ECDSA signing with deterministic nonces (RFC 6979)
 * - Signature verification
 * - Key validation
 */

console.log('=== Basic P-256 (secp256r1) Usage ===\n');

// 1. Generate a private key
console.log('1. Private Key Generation');
console.log('-'.repeat(40));

// In production, use crypto.getRandomValues()
const privateKey = new Uint8Array(32);
crypto.getRandomValues(privateKey);

console.log(`Private key: ${Hex.fromBytes(privateKey)}`);
console.log(`Length: ${privateKey.length} bytes`);
console.log(`Valid: ${P256.validatePrivateKey(privateKey)}\n`);

// 2. Derive public key from private key
console.log('2. Public Key Derivation');
console.log('-'.repeat(40));

const publicKey = P256.derivePublicKey(privateKey);

console.log(`Public key: ${Hex.fromBytes(publicKey)}`);
console.log(`Length: ${publicKey.length} bytes (uncompressed x || y)`);
console.log(`Valid: ${P256.validatePublicKey(publicKey)}`);
console.log(`X coordinate: ${Hex.fromBytes(publicKey.slice(0, 32))}`);
console.log(`Y coordinate: ${Hex.fromBytes(publicKey.slice(32, 64))}\n`);

// 3. Sign a message
console.log('3. ECDSA Signature Generation');
console.log('-'.repeat(40));

const message = 'Hello, P-256!';
const messageHash = Hash.keccak256String(message);

console.log(`Message: "${message}"`);
console.log(`Message hash: ${Hex.fromBytes(messageHash)}`);

const signature = P256.sign(messageHash, privateKey);

console.log(`\nSignature r: ${Hex.fromBytes(signature.r)}`);
console.log(`Signature s: ${Hex.fromBytes(signature.s)}`);
console.log(`Total size: ${signature.r.length + signature.s.length} bytes\n`);

// 4. Verify signature
console.log('4. Signature Verification');
console.log('-'.repeat(40));

const isValid = P256.verify(signature, messageHash, publicKey);
console.log(`Signature valid: ${isValid}`);

// Verify with wrong message fails
const wrongHash = Hash.keccak256String('Wrong message');
const isInvalid = P256.verify(signature, wrongHash, publicKey);
console.log(`Wrong message: ${isInvalid} (should be false)\n`);

// 5. Deterministic signatures (RFC 6979)
console.log('5. Deterministic Signatures (RFC 6979)');
console.log('-'.repeat(40));

const testMessage = 'test';
const testHash = Hash.keccak256String(testMessage);

// Sign the same message twice
const sig1 = P256.sign(testHash, privateKey);
const sig2 = P256.sign(testHash, privateKey);

console.log(`Message: "${testMessage}"`);
console.log(`Signature 1 r: ${Hex.fromBytes(sig1.r).slice(0, 20)}...`);
console.log(`Signature 2 r: ${Hex.fromBytes(sig2.r).slice(0, 20)}...`);

const rMatch = Hex.fromBytes(sig1.r) === Hex.fromBytes(sig2.r);
const sMatch = Hex.fromBytes(sig1.s) === Hex.fromBytes(sig2.s);

console.log(`\nSignatures identical: ${rMatch && sMatch}`);
console.log('RFC 6979 ensures same message + key = same signature\n');

// 6. Multiple messages with same key
console.log('6. Multiple Messages with Same Key');
console.log('-'.repeat(40));

const messages = ['message1', 'message2', 'message3'];

messages.forEach((msg, i) => {
  const hash = Hash.keccak256String(msg);
  const sig = P256.sign(hash, privateKey);
  const valid = P256.verify(sig, hash, publicKey);

  console.log(`Message ${i + 1}: "${msg}"`);
  console.log(`  Signature r: ${Hex.fromBytes(sig.r).slice(0, 20)}...`);
  console.log(`  Valid: ${valid}`);
});

console.log();

// 7. Key validation
console.log('7. Key Validation');
console.log('-'.repeat(40));

// Valid private key
const validPrivate = new Uint8Array(32).fill(1);
console.log(`Valid private key: ${P256.validatePrivateKey(validPrivate)}`);

// Invalid private key (all zeros)
const zeroKey = new Uint8Array(32);
console.log(`Zero private key: ${P256.validatePrivateKey(zeroKey)} (invalid)`);

// Invalid private key (wrong length)
const shortKey = new Uint8Array(16);
console.log(`Short private key: ${P256.validatePrivateKey(shortKey)} (invalid)`);

// Valid public key
console.log(`Valid public key: ${P256.validatePublicKey(publicKey)}`);

// Invalid public key (wrong length)
const invalidPubKey = new Uint8Array(32);
console.log(`Wrong length public key: ${P256.validatePublicKey(invalidPubKey)} (invalid)\n`);

// 8. Curve order and key space
console.log('8. P-256 Curve Parameters');
console.log('-'.repeat(40));

console.log(`Curve: NIST P-256 (secp256r1, prime256v1)`);
console.log(`Security level: 128 bits`);
console.log(`Private key size: ${P256.PRIVATE_KEY_SIZE} bytes`);
console.log(`Public key size: ${P256.PUBLIC_KEY_SIZE} bytes (uncompressed)`);
console.log(`Signature component size: ${P256.SIGNATURE_COMPONENT_SIZE} bytes (r and s)`);
console.log(`\nCurve order: 0x${P256.CURVE_ORDER.toString(16)}`);
console.log(`Total valid private keys: ~2^256\n`);

// 9. Different keys produce different signatures
console.log('9. Different Keys → Different Signatures');
console.log('-'.repeat(40));

const privateKey2 = new Uint8Array(32);
crypto.getRandomValues(privateKey2);
const publicKey2 = P256.derivePublicKey(privateKey2);

const testMsg = 'shared message';
const testMsgHash = Hash.keccak256String(testMsg);

const sigA = P256.sign(testMsgHash, privateKey);
const sigB = P256.sign(testMsgHash, privateKey2);

console.log(`Message: "${testMsg}"`);
console.log(`\nKey A signature r: ${Hex.fromBytes(sigA.r).slice(0, 20)}...`);
console.log(`Key B signature r: ${Hex.fromBytes(sigB.r).slice(0, 20)}...`);

const sameSignature = Hex.fromBytes(sigA.r) === Hex.fromBytes(sigB.r);
console.log(`\nSignatures different: ${!sameSignature}`);

const validA = P256.verify(sigA, testMsgHash, publicKey);
const validB = P256.verify(sigB, testMsgHash, publicKey2);

console.log(`Signature A valid with key A: ${validA}`);
console.log(`Signature B valid with key B: ${validB}`);
console.log(`Signature A valid with key B: ${P256.verify(sigA, testMsgHash, publicKey2)} (cross-validation fails)\n`);

console.log('=== Complete ===');
