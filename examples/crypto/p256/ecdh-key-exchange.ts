import * as P256 from "../../../src/crypto/P256/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";
import { SHA256 } from "../../../src/crypto/SHA256/index.js";

/**
 * P-256 ECDH Key Exchange
 *
 * Demonstrates Elliptic Curve Diffie-Hellman with P-256:
 * - Establishing shared secrets
 * - Key derivation for symmetric encryption
 * - Perfect forward secrecy
 * - TLS 1.3 key exchange pattern
 */

console.log("=== P-256 ECDH Key Exchange ===\n");

// 1. Basic ECDH key exchange
console.log("1. Basic ECDH Key Exchange");
console.log("-".repeat(40));

// Alice generates keypair
const alicePrivate = new Uint8Array(32);
crypto.getRandomValues(alicePrivate);
const alicePublic = P256.derivePublicKey(alicePrivate);

console.log("Alice generates keypair:");
console.log(
	`  Private: ${Hex.fromBytes(alicePrivate).slice(0, 40)}... (secret)`,
);
console.log(`  Public:  ${Hex.fromBytes(alicePublic).slice(0, 40)}...`);

// Bob generates keypair
const bobPrivate = new Uint8Array(32);
crypto.getRandomValues(bobPrivate);
const bobPublic = P256.derivePublicKey(bobPrivate);

console.log("\nBob generates keypair:");
console.log(`  Private: ${Hex.fromBytes(bobPrivate).slice(0, 40)}... (secret)`);
console.log(`  Public:  ${Hex.fromBytes(bobPublic).slice(0, 40)}...`);

// Exchange public keys
console.log("\nPublic key exchange (over insecure channel):");
console.log("  Alice → Bob: Alice's public key");
console.log("  Bob → Alice: Bob's public key\n");

// 2. Compute shared secret
console.log("2. Computing Shared Secret");
console.log("-".repeat(40));

// Alice computes shared secret
const sharedSecretAlice = P256.ecdh(alicePrivate, bobPublic);

console.log("Alice computes:");
console.log(`  shared_secret = ECDH(alice_private, bob_public)`);
console.log(`  Result: ${Hex.fromBytes(sharedSecretAlice)}`);

// Bob computes shared secret
const sharedSecretBob = P256.ecdh(bobPrivate, alicePublic);

console.log("\nBob computes:");
console.log(`  shared_secret = ECDH(bob_private, alice_public)`);
console.log(`  Result: ${Hex.fromBytes(sharedSecretBob)}`);

// Verify secrets match
const secretsMatch =
	Hex.fromBytes(sharedSecretAlice) === Hex.fromBytes(sharedSecretBob);
console.log(`\nShared secrets match: ${secretsMatch}`);
console.log("Both parties have the same secret without transmitting it!\n");

// 3. Key derivation for symmetric encryption
console.log("3. Key Derivation for Symmetric Encryption");
console.log("-".repeat(40));

console.log("Raw ECDH output should not be used directly as a key.");
console.log("Use a Key Derivation Function (KDF) like HKDF:\n");

// Simple KDF example: hash the shared secret
const derivedKey = SHA256.hash(sharedSecretAlice);

console.log(`Shared secret: ${Hex.fromBytes(sharedSecretAlice)}`);
console.log(`Derived key (SHA-256): ${Hex.fromBytes(derivedKey)}`);
console.log("\nThis derived key can be used for:");
console.log("- AES-256-GCM encryption");
console.log("- ChaCha20-Poly1305 encryption");
console.log("- HMAC authentication\n");

// 4. Perfect Forward Secrecy
console.log("4. Perfect Forward Secrecy (PFS)");
console.log("-".repeat(40));

console.log("Generate ephemeral keys for each session:\n");

// Session 1
const session1AlicePrivate = new Uint8Array(32);
crypto.getRandomValues(session1AlicePrivate);
const session1AlicePublic = P256.derivePublicKey(session1AlicePrivate);

const session1BobPrivate = new Uint8Array(32);
crypto.getRandomValues(session1BobPrivate);
const session1BobPublic = P256.derivePublicKey(session1BobPrivate);

const session1Secret = P256.ecdh(session1AlicePrivate, session1BobPublic);

console.log(
	`Session 1 secret: ${Hex.fromBytes(session1Secret).slice(0, 40)}...`,
);

// Session 2 (new ephemeral keys)
const session2AlicePrivate = new Uint8Array(32);
crypto.getRandomValues(session2AlicePrivate);
const session2AlicePublic = P256.derivePublicKey(session2AlicePrivate);

const session2BobPrivate = new Uint8Array(32);
crypto.getRandomValues(session2BobPrivate);
const session2BobPublic = P256.derivePublicKey(session2BobPrivate);

const session2Secret = P256.ecdh(session2AlicePrivate, session2BobPublic);

console.log(
	`Session 2 secret: ${Hex.fromBytes(session2Secret).slice(0, 40)}...`,
);

const sessionSecretsMatch =
	Hex.fromBytes(session1Secret) === Hex.fromBytes(session2Secret);
console.log(`\nSessions use different secrets: ${!sessionSecretsMatch}`);
console.log("Compromising one session doesn't affect others (PFS)\n");

// 5. TLS 1.3 key exchange pattern
console.log("5. TLS 1.3 Key Exchange Pattern");
console.log("-".repeat(40));

console.log("TLS 1.3 handshake with P-256 (ECDHE):");
console.log("\n1. ClientHello:");
console.log("   - Client generates ephemeral P-256 keypair");
console.log("   - Sends public key in key_share extension");

const clientPrivate = new Uint8Array(32);
crypto.getRandomValues(clientPrivate);
const clientPublic = P256.derivePublicKey(clientPrivate);
console.log(
	`   - Client public: ${Hex.fromBytes(clientPublic).slice(0, 40)}...`,
);

console.log("\n2. ServerHello:");
console.log("   - Server generates ephemeral P-256 keypair");
console.log("   - Sends public key in key_share extension");

const serverPrivate = new Uint8Array(32);
crypto.getRandomValues(serverPrivate);
const serverPublic = P256.derivePublicKey(serverPrivate);
console.log(
	`   - Server public: ${Hex.fromBytes(serverPublic).slice(0, 40)}...`,
);

console.log("\n3. Both parties compute shared secret:");
const tlsSharedSecret = P256.ecdh(clientPrivate, serverPublic);
console.log(
	`   - Shared secret: ${Hex.fromBytes(tlsSharedSecret).slice(0, 40)}...`,
);

console.log("\n4. Derive session keys using HKDF:");
const handshakeSecret = SHA256.hash(tlsSharedSecret);
console.log(
	`   - Handshake secret: ${Hex.fromBytes(handshakeSecret).slice(0, 40)}...`,
);

console.log("\nConnection encrypted with ephemeral keys");
console.log("Private keys discarded after handshake (PFS)\n");

// 6. Multiple parties key exchange
console.log("6. Multi-Party Key Exchange");
console.log("-".repeat(40));

// Carol joins the conversation
const carolPrivate = new Uint8Array(32);
crypto.getRandomValues(carolPrivate);
const carolPublic = P256.derivePublicKey(carolPrivate);

console.log("Alice, Bob, and Carol establish pairwise secrets:\n");

// Alice-Bob shared secret
const aliceBobSecret = P256.ecdh(alicePrivate, bobPublic);
console.log(
	`Alice-Bob secret:   ${Hex.fromBytes(aliceBobSecret).slice(0, 40)}...`,
);

// Alice-Carol shared secret
const aliceCarolSecret = P256.ecdh(alicePrivate, carolPublic);
console.log(
	`Alice-Carol secret: ${Hex.fromBytes(aliceCarolSecret).slice(0, 40)}...`,
);

// Bob-Carol shared secret
const bobCarolSecret = P256.ecdh(bobPrivate, carolPublic);
console.log(
	`Bob-Carol secret:   ${Hex.fromBytes(bobCarolSecret).slice(0, 40)}...`,
);

console.log("\nEach pair has a unique shared secret");
console.log("Used in group messaging (Signal Protocol)\n");

// 7. Security considerations
console.log("7. Security Considerations");
console.log("-".repeat(40));

console.log("ECDH Security Requirements:");
console.log("✓ Use ephemeral keys for forward secrecy");
console.log("✓ Validate all public keys before use");
console.log("✓ Use KDF (HKDF) to derive encryption keys");
console.log("✓ Never reuse the same private key pair");

console.log("\nCommon mistakes:");
console.log("✗ Using ECDH output directly as AES key");
console.log("✗ Reusing static keys (breaks forward secrecy)");
console.log("✗ Not validating public keys (invalid curve attack)");
console.log("✗ Weak random number generation\n");

// 8. P-256 ECDH vs X25519
console.log("8. P-256 ECDH vs X25519 (Curve25519)");
console.log("-".repeat(40));

console.log("P-256 (secp256r1):");
console.log("✓ NIST standardized (FIPS compliance)");
console.log("✓ Hardware support (Secure Enclave, TPM)");
console.log("✓ TLS 1.3 default");
console.log("✗ Slower than X25519");
console.log("✗ More complex implementation");

console.log("\nX25519 (Curve25519):");
console.log("✓ Faster performance (~2x)");
console.log("✓ Simpler, safer implementation");
console.log("✓ Modern protocol preference (WireGuard, Signal)");
console.log("✗ Not NIST standardized");
console.log("✗ Less hardware support");

console.log("\nUse P-256 for:");
console.log("- Government/enterprise (FIPS requirement)");
console.log("- Hardware-backed keys (iOS, Android, YubiKey)");
console.log("- WebAuthn/FIDO2 compatibility");
console.log("- TLS with legacy clients\n");

console.log("=== Complete ===");
