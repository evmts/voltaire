import * as Ed25519 from '../../../src/crypto/Ed25519/index.js';
import { Hex } from '../../../src/primitives/Hex/index.js';

/**
 * Ed25519 in Signal Protocol Context
 *
 * Demonstrates Ed25519 usage patterns similar to Signal:
 * - Identity key signatures
 * - Prekey signatures
 * - Multi-device coordination
 * - Perfect forward secrecy patterns
 *
 * Note: This is simplified; real Signal uses X25519 for ECDH
 * and Ed25519 for signatures
 */

console.log('=== Ed25519 in Signal Protocol Context ===\n');

// 1. Identity Key Generation
console.log('1. Identity Key Generation');
console.log('-'.repeat(40));

// Alice's identity key (long-term)
const aliceSeed = new Uint8Array(32);
crypto.getRandomValues(aliceSeed);
const aliceIdentity = Ed25519.keypairFromSeed(aliceSeed);

console.log('Alice generates long-term identity key:');
console.log(`Identity public key: ${Hex.fromBytes(aliceIdentity.publicKey).slice(0, 40)}...`);
console.log('Private key stored securely, never shared\n');

// Bob's identity key
const bobSeed = new Uint8Array(32);
crypto.getRandomValues(bobSeed);
const bobIdentity = Ed25519.keypairFromSeed(bobSeed);

console.log('Bob generates long-term identity key:');
console.log(`Identity public key: ${Hex.fromBytes(bobIdentity.publicKey).slice(0, 40)}...`);
console.log('Published to Signal server for discovery\n');

// 2. Prekey Bundle Signing
console.log('2. Prekey Bundle Signing');
console.log('-'.repeat(40));

// Bob creates signed prekey bundle
const prekeyData = new Uint8Array(32);
crypto.getRandomValues(prekeyData);

console.log('Bob creates signed prekey bundle:');
console.log(`Prekey data: ${Hex.fromBytes(prekeyData).slice(0, 40)}...`);

// Sign prekey with identity key
const prekeySignature = Ed25519.sign(prekeyData, bobIdentity.secretKey);

console.log(`Prekey signature: ${Hex.fromBytes(prekeySignature).slice(0, 40)}...`);
console.log('\nUploaded to Signal server:');
console.log('- Identity public key (for verification)');
console.log('- Signed prekey + signature');
console.log('- One-time prekeys (unsigned)\n');

// 3. Prekey Verification
console.log('3. Prekey Bundle Verification');
console.log('-'.repeat(40));

console.log('Alice downloads Bob\'s prekey bundle:');
console.log('1. Fetches identity key from server');
console.log('2. Verifies prekey signature');

const prekeyValid = Ed25519.verify(
  prekeySignature,
  prekeyData,
  bobIdentity.publicKey
);

console.log(`\nPrekey signature valid: ${prekeyValid}`);

if (prekeyValid) {
  console.log('✓ Bob\'s identity confirmed');
  console.log('✓ Prekey authenticated');
  console.log('✓ Safe to establish session\n');
} else {
  console.log('✗ Invalid signature - possible MITM attack!\n');
}

// 4. Safety Number Verification
console.log('4. Safety Number Verification');
console.log('-'.repeat(40));

console.log('Signal safety number = hash of both identity keys:');

// Combine both public keys
const safetyNumberData = new Uint8Array([
  ...aliceIdentity.publicKey,
  ...bobIdentity.publicKey,
]);

// In real Signal, this is hashed and formatted as digits
console.log(`\nAlice's identity: ${Hex.fromBytes(aliceIdentity.publicKey).slice(0, 20)}...`);
console.log(`Bob's identity:   ${Hex.fromBytes(bobIdentity.publicKey).slice(0, 20)}...`);

console.log('\nSafety number allows users to verify:');
console.log('• No man-in-the-middle attack');
console.log('• Direct end-to-end encryption');
console.log('• Identity keys match (compare out-of-band)\n');

// 5. Message Signing
console.log('5. Message Signing (for sender authentication)');
console.log('-'.repeat(40));

const message = new TextEncoder().encode('Hello Bob! This is Alice.');

console.log(`Alice sends message: "${new TextDecoder().decode(message)}"`);

// Sign message with identity key
const messageSignature = Ed25519.sign(message, aliceIdentity.secretKey);

console.log(`Message signature: ${Hex.fromBytes(messageSignature).slice(0, 40)}...`);

// Bob verifies
const msgValid = Ed25519.verify(
  messageSignature,
  message,
  aliceIdentity.publicKey
);

console.log(`\nBob verifies signature: ${msgValid}`);
console.log('Message authenticity confirmed\n');

// 6. Multi-Device Signing
console.log('6. Multi-Device Coordination');
console.log('-'.repeat(40));

console.log('Alice has multiple devices:');

// Device 1 (phone)
const device1Seed = new Uint8Array(32);
crypto.getRandomValues(device1Seed);
const device1Identity = Ed25519.keypairFromSeed(device1Seed);

console.log(`\nDevice 1 (Phone): ${Hex.fromBytes(device1Identity.publicKey).slice(0, 40)}...`);

// Device 2 (desktop)
const device2Seed = new Uint8Array(32);
crypto.getRandomValues(device2Seed);
const device2Identity = Ed25519.keypairFromSeed(device2Seed);

console.log(`Device 2 (Desktop): ${Hex.fromBytes(device2Identity.publicKey).slice(0, 40)}...`);

// Device 3 (tablet)
const device3Seed = new Uint8Array(32);
crypto.getRandomValues(device3Seed);
const device3Identity = Ed25519.keypairFromSeed(device3Seed);

console.log(`Device 3 (Tablet): ${Hex.fromBytes(device3Identity.publicKey).slice(0, 40)}...`);

console.log('\nEach device has independent identity key');
console.log('Signal server tracks all device keys per user\n');

// 7. Cross-Device Message Sending
console.log('7. Cross-Device Message Sending');
console.log('-'.repeat(40));

const crossDeviceMsg = new TextEncoder().encode('Sync message across devices');

// Sign with each device
const sig1 = Ed25519.sign(crossDeviceMsg, device1Identity.secretKey);
const sig2 = Ed25519.sign(crossDeviceMsg, device2Identity.secretKey);
const sig3 = Ed25519.sign(crossDeviceMsg, device3Identity.secretKey);

console.log('Message sent to all of Alice\'s devices:');
console.log(`\nDevice 1 signature: ${Hex.fromBytes(sig1).slice(0, 40)}...`);
console.log(`  Verified: ${Ed25519.verify(sig1, crossDeviceMsg, device1Identity.publicKey)}`);

console.log(`\nDevice 2 signature: ${Hex.fromBytes(sig2).slice(0, 40)}...`);
console.log(`  Verified: ${Ed25519.verify(sig2, crossDeviceMsg, device2Identity.publicKey)}`);

console.log(`\nDevice 3 signature: ${Hex.fromBytes(sig3).slice(0, 40)}...`);
console.log(`  Verified: ${Ed25519.verify(sig3, crossDeviceMsg, device3Identity.publicKey)}\n`);

// 8. Identity Key Rotation
console.log('8. Identity Key Rotation');
console.log('-'.repeat(40));

console.log('Alice rotates identity key (security best practice):');

const oldIdentity = aliceIdentity;
const newSeed = new Uint8Array(32);
crypto.getRandomValues(newSeed);
const newIdentity = Ed25519.keypairFromSeed(newSeed);

console.log(`\nOld identity: ${Hex.fromBytes(oldIdentity.publicKey).slice(0, 40)}...`);
console.log(`New identity: ${Hex.fromBytes(newIdentity.publicKey).slice(0, 40)}...`);

// Sign new identity with old identity (proof of rotation)
const rotationProof = Ed25519.sign(
  newIdentity.publicKey,
  oldIdentity.secretKey
);

console.log(`\nRotation signature: ${Hex.fromBytes(rotationProof).slice(0, 40)}...`);

const rotationValid = Ed25519.verify(
  rotationProof,
  newIdentity.publicKey,
  oldIdentity.publicKey
);

console.log(`Rotation verified: ${rotationValid}`);
console.log('\nContacts can verify the rotation is legitimate\n');

// 9. Sealed Sender Authentication
console.log('9. Sealed Sender Authentication');
console.log('-'.repeat(40));

console.log('Sealed sender hides sender identity from server:');

// Anonymous sender signs with ephemeral key
const ephemeralSeed = new Uint8Array(32);
crypto.getRandomValues(ephemeralSeed);
const ephemeralKey = Ed25519.keypairFromSeed(ephemeralSeed);

const sealedMessage = new TextEncoder().encode('Anonymous message');
const sealedSig = Ed25519.sign(sealedMessage, ephemeralKey.secretKey);

console.log(`\nEphemeral public key: ${Hex.fromBytes(ephemeralKey.publicKey).slice(0, 40)}...`);
console.log(`Sealed signature: ${Hex.fromBytes(sealedSig).slice(0, 40)}...`);

// Recipient verifies ephemeral signature
const sealedValid = Ed25519.verify(
  sealedSig,
  sealedMessage,
  ephemeralKey.publicKey
);

console.log(`\nSignature valid: ${sealedValid}`);
console.log('Server cannot determine sender\n');

// 10. Group Messaging Signatures
console.log('10. Group Messaging');
console.log('-'.repeat(40));

// Group admin signs member list
const groupMembers = new Uint8Array([
  ...aliceIdentity.publicKey,
  ...bobIdentity.publicKey,
  ...device1Identity.publicKey,
]);

console.log('Group admin creates signed member list:');

// Admin identity
const adminSeed = new Uint8Array(32);
crypto.getRandomValues(adminSeed);
const adminIdentity = Ed25519.keypairFromSeed(adminSeed);

const memberListSig = Ed25519.sign(groupMembers, adminIdentity.secretKey);

console.log(`\nAdmin identity: ${Hex.fromBytes(adminIdentity.publicKey).slice(0, 40)}...`);
console.log(`Member list signature: ${Hex.fromBytes(memberListSig).slice(0, 40)}...`);

// Members verify
const listValid = Ed25519.verify(
  memberListSig,
  groupMembers,
  adminIdentity.publicKey
);

console.log(`\nMember list verified: ${listValid}`);
console.log('Prevents unauthorized member additions\n');

// 11. Security Properties
console.log('11. Ed25519 Security Properties for Messaging');
console.log('-'.repeat(40));

console.log('Why Signal uses Ed25519:');
console.log('\n1. Deterministic signatures:');
console.log('   - No nonce generation (safer than ECDSA)');
console.log('   - Eliminates nonce reuse attacks');

console.log('\n2. Fast verification:');
console.log('   - Important for multi-device sync');
console.log('   - Faster than ECDSA and RSA');

console.log('\n3. Small signatures:');
console.log('   - 64 bytes (compact for mobile data)');
console.log('   - Reduces message overhead');

console.log('\n4. No malleability:');
console.log('   - Signatures cannot be modified');
console.log('   - Critical for message integrity');

console.log('\n5. Simpler implementation:');
console.log('   - Fewer edge cases than ECDSA');
console.log('   - Harder to implement incorrectly\n');

console.log('=== Complete ===');
