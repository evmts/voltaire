import * as P256 from '../../../src/crypto/P256/index.js';
import { SHA256 } from '../../../src/crypto/SHA256/index.js';
import { Hex } from '../../../src/primitives/Hex/index.js';

/**
 * WebAuthn P-256 Signatures
 *
 * Demonstrates P-256 in WebAuthn (FIDO2) context:
 * - Face ID / Touch ID authentication flow
 * - YubiKey and hardware security key usage
 * - Authenticator data handling
 * - Client data JSON hashing
 * - Passkey-based account abstraction
 */

console.log('=== WebAuthn P-256 Signatures ===\n');

// 1. WebAuthn Registration (Credential Creation)
console.log('1. WebAuthn Registration Flow');
console.log('-'.repeat(40));

console.log('During registration, the authenticator:');
console.log('1. Generates a new P-256 keypair');
console.log('2. Stores private key in Secure Enclave/TPM');
console.log('3. Returns public key to relying party\n');

// Simulate authenticator generating keypair
const authenticatorPrivateKey = new Uint8Array(32);
crypto.getRandomValues(authenticatorPrivateKey);

const authenticatorPublicKey = P256.derivePublicKey(authenticatorPrivateKey);

console.log('Authenticator generates P-256 keypair:');
console.log(`Public key (64 bytes): ${Hex.fromBytes(authenticatorPublicKey)}`);
console.log('Private key: [stored in Secure Enclave, never exposed]\n');

// 2. WebAuthn Authentication (Assertion)
console.log('2. WebAuthn Authentication Flow');
console.log('-'.repeat(40));

// Authenticator data (37+ bytes)
// Contains RP ID hash (32 bytes) + flags (1 byte) + counter (4 bytes)
const rpIdHash = SHA256.hash(new TextEncoder().encode('example.com'));
const flags = new Uint8Array([0x05]); // User present + User verified
const signCount = new Uint8Array([0x00, 0x00, 0x00, 0x01]); // Counter = 1

const authenticatorData = new Uint8Array([
  ...rpIdHash,
  ...flags,
  ...signCount,
]);

console.log('Authenticator data components:');
console.log(`RP ID hash (32 bytes): ${Hex.fromBytes(rpIdHash).slice(0, 20)}...`);
console.log(`Flags (1 byte): 0x${flags[0].toString(16).padStart(2, '0')} (UP=1, UV=1)`);
console.log(`Sign count (4 bytes): ${new DataView(signCount.buffer).getUint32(0)}`);
console.log(`Total authenticator data: ${authenticatorData.length} bytes\n`);

// 3. Client data JSON
console.log('3. Client Data JSON');
console.log('-'.repeat(40));

const challenge = new Uint8Array(32);
crypto.getRandomValues(challenge);

const clientDataJSON = JSON.stringify({
  type: 'webauthn.get',
  challenge: btoa(String.fromCharCode(...challenge)),
  origin: 'https://example.com',
  crossOrigin: false,
});

console.log('Client data JSON:');
console.log(clientDataJSON);

const clientDataHash = SHA256.hash(new TextEncoder().encode(clientDataJSON));
console.log(`\nClient data hash: ${Hex.fromBytes(clientDataHash).slice(0, 40)}...\n`);

// 4. WebAuthn signature generation
console.log('4. WebAuthn Signature Generation');
console.log('-'.repeat(40));

// WebAuthn signs: authenticatorData || hash(clientDataJSON)
const signedData = new Uint8Array([
  ...authenticatorData,
  ...clientDataHash,
]);

console.log('Signed data structure:');
console.log(`Authenticator data: ${authenticatorData.length} bytes`);
console.log(`Client data hash: ${clientDataHash.length} bytes`);
console.log(`Total signed data: ${signedData.length} bytes`);

// Hash the signed data (WebAuthn uses SHA-256, not Keccak)
const signatureHash = SHA256.hash(signedData);
console.log(`\nSignature hash (SHA-256): ${Hex.fromBytes(signatureHash)}`);

// Authenticator signs with P-256
const signature = P256.sign(signatureHash, authenticatorPrivateKey);

console.log(`\nP-256 signature generated:`);
console.log(`  r: ${Hex.fromBytes(signature.r).slice(0, 40)}...`);
console.log(`  s: ${Hex.fromBytes(signature.s).slice(0, 40)}...\n`);

// 5. WebAuthn signature verification
console.log('5. WebAuthn Signature Verification');
console.log('-'.repeat(40));

console.log('Relying party verification steps:');
console.log('1. Reconstruct authenticatorData || hash(clientDataJSON)');
console.log('2. Hash with SHA-256');
console.log('3. Verify P-256 signature with stored public key\n');

// Verify signature
const isValid = P256.verify(signature, signatureHash, authenticatorPublicKey);
console.log(`Signature valid: ${isValid}`);
console.log('Authentication successful! User verified with Face ID/Touch ID\n');

// 6. Hardware authenticator types
console.log('6. Hardware Authenticator Types (all use P-256)');
console.log('-'.repeat(40));

console.log('iOS Secure Enclave:');
console.log('- Face ID / Touch ID');
console.log('- P-256 only curve supported');
console.log('- Private key never leaves hardware');
console.log('- Biometric verification required');

console.log('\nYubiKey:');
console.log('- USB/NFC hardware security key');
console.log('- FIDO2 certified');
console.log('- P-256 default (also supports Ed25519)');
console.log('- Physical touch required');

console.log('\nAndroid Keystore:');
console.log('- Hardware-backed on modern devices');
console.log('- Fingerprint / Face unlock');
console.log('- P-256 for WebAuthn');
console.log('- TEE or StrongBox protected');

console.log('\nWindows Hello:');
console.log('- TPM 2.0 backed');
console.log('- Face / fingerprint / PIN');
console.log('- P-256 signatures');
console.log('- Microsoft Passport integration\n');

// 7. Passkey-based account abstraction
console.log('7. Passkey Account Abstraction (Ethereum)');
console.log('-'.repeat(40));

console.log('EIP-7212 enables P-256 verification on-chain:');
console.log('- Precompile at address 0x100');
console.log('- Verifies P-256 signatures in EVM');
console.log('- Enables smart contract wallets with WebAuthn');

console.log('\nUse cases:');
console.log('- Sign transactions with Face ID');
console.log('- No seed phrases to manage');
console.log('- Hardware-backed security');
console.log('- Mainstream UX for crypto wallets\n');

// Simulate Ethereum transaction signing with passkey
const txHash = SHA256.hash(new TextEncoder().encode('Transfer 1 ETH to 0x123...'));
const passkeySignature = P256.sign(txHash, authenticatorPrivateKey);

console.log('Example: Sign Ethereum transaction with passkey');
console.log(`Transaction hash: ${Hex.fromBytes(txHash).slice(0, 40)}...`);
console.log(`Passkey signature: ${Hex.fromBytes(passkeySignature.r).slice(0, 20)}...`);
console.log('Smart contract wallet verifies via EIP-7212 precompile\n');

// 8. COSE key format (WebAuthn standard)
console.log('8. COSE Key Format (WebAuthn Standard)');
console.log('-'.repeat(40));

console.log('WebAuthn returns public keys in COSE format (CBOR):');
console.log('COSE_Key = {');
console.log('  1: 2,              // kty: EC2 (Elliptic Curve)');
console.log('  3: -7,             // alg: ES256 (ECDSA with SHA-256)');
console.log('  -1: 1,             // crv: P-256');
console.log('  -2: <x bytes>,     // x coordinate (32 bytes)');
console.log('  -3: <y bytes>      // y coordinate (32 bytes)');
console.log('}');

console.log('\nConversion to raw format:');
console.log(`X: ${Hex.fromBytes(authenticatorPublicKey.slice(0, 32)).slice(0, 40)}...`);
console.log(`Y: ${Hex.fromBytes(authenticatorPublicKey.slice(32, 64)).slice(0, 40)}...`);
console.log('Raw format: X || Y (64 bytes uncompressed)\n');

// 9. Comparison with traditional ECDSA (secp256k1)
console.log('9. P-256 vs Secp256k1 for Web3');
console.log('-'.repeat(40));

console.log('P-256 (WebAuthn):');
console.log('✓ Hardware support (Secure Enclave, TPM, YubiKey)');
console.log('✓ Mainstream UX (Face ID, fingerprint)');
console.log('✓ No seed phrases needed');
console.log('✗ Requires EIP-7212 for Ethereum (not yet standard)');

console.log('\nSecp256k1 (Traditional):');
console.log('✓ Native Ethereum support (ecrecover)');
console.log('✓ Existing wallet infrastructure');
console.log('✗ No hardware wallet support by default');
console.log('✗ Seed phrases required (UX barrier)');

console.log('\nFuture: Hybrid wallets use both');
console.log('- P-256 passkey for daily transactions (convenience)');
console.log('- Secp256k1 for recovery (compatibility)\n');

console.log('=== Complete ===');
