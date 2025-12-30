/**
 * Diffie-Hellman Key Exchange with ModExp
 *
 * Classic Diffie-Hellman uses modular exponentiation to establish
 * a shared secret over an insecure channel.
 *
 * Protocol:
 * 1. Agree on public parameters: prime p and generator g
 * 2. Alice picks private a, computes A = g^a mod p
 * 3. Bob picks private b, computes B = g^b mod p
 * 4. Exchange A and B publicly
 * 5. Alice computes s = B^a mod p
 * 6. Bob computes s = A^b mod p
 * 7. Both have same shared secret s = g^(ab) mod p
 */

import { ModExp } from "@tevm/voltaire";

console.log("=== Diffie-Hellman Key Exchange ===\n");

// === Toy Example ===
console.log("--- Toy Example (small numbers) ---");

// Public parameters (use much larger in production!)
const pSmall = 23n; // Prime modulus
const gSmall = 5n; // Generator

console.log("Public parameters:");
console.log("  Prime p =", pSmall.toString());
console.log("  Generator g =", gSmall.toString());

// Alice generates her key pair
const alicePrivateSmall = 6n;
const alicePublicSmall = ModExp.modexp(gSmall, alicePrivateSmall, pSmall);

console.log("\nAlice:");
console.log("  Private key (a):", alicePrivateSmall.toString());
console.log("  Public key (A = g^a mod p):", alicePublicSmall.toString());

// Bob generates his key pair
const bobPrivateSmall = 15n;
const bobPublicSmall = ModExp.modexp(gSmall, bobPrivateSmall, pSmall);

console.log("\nBob:");
console.log("  Private key (b):", bobPrivateSmall.toString());
console.log("  Public key (B = g^b mod p):", bobPublicSmall.toString());

// Both compute the shared secret
const aliceSecretSmall = ModExp.modexp(
	bobPublicSmall,
	alicePrivateSmall,
	pSmall,
);
const bobSecretSmall = ModExp.modexp(alicePublicSmall, bobPrivateSmall, pSmall);

console.log("\nShared secret computation:");
console.log("  Alice computes B^a mod p =", aliceSecretSmall.toString());
console.log("  Bob computes A^b mod p =", bobSecretSmall.toString());
console.log("  Secrets match:", aliceSecretSmall === bobSecretSmall);

// === 2048-bit MODP Group (RFC 3526) ===
console.log("\n--- RFC 3526 MODP Group (2048-bit) ---");

// 2048-bit MODP Group (Group 14 from RFC 3526)
const p2048 =
	0xffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece45b3dc2007cb8a163bf0598da48361c55d39a69163fa8fd24cf5f83655d23dca3ad961c62f356208552bb9ed529077096966d670c354e4abc9804f1746c08ca18217c32905e462e36ce3be39e772c180e86039b2783a2ec07a28fb5c55df06f4c52c9de2bcbf6955817183995497cea956ae515d2261898fa051015728e5a8aacaa68ffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000n;

const g2048 = 2n;

console.log("2048-bit MODP Group:");
console.log(
	"  Prime p (hex, truncated):",
	p2048.toString(16).slice(0, 40) + "...",
);
console.log("  Generator g =", g2048.toString());

// Simulate random private keys (in production, use cryptographically secure random)
const alicePrivate2048 =
	0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefn;
const bobPrivate2048 =
	0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321n;

console.log("\nComputing public keys (this may take a moment)...");

const startAlice = performance.now();
const alicePublic2048 = ModExp.modexp(g2048, alicePrivate2048, p2048);
const aliceTime = performance.now() - startAlice;

const startBob = performance.now();
const bobPublic2048 = ModExp.modexp(g2048, bobPrivate2048, p2048);
const bobTime = performance.now() - startBob;

console.log("  Alice public key computed in", aliceTime.toFixed(2), "ms");
console.log("  Bob public key computed in", bobTime.toFixed(2), "ms");

// Compute shared secrets
const startSharedA = performance.now();
const aliceSecret2048 = ModExp.modexp(bobPublic2048, alicePrivate2048, p2048);
const sharedTimeA = performance.now() - startSharedA;

const startSharedB = performance.now();
const bobSecret2048 = ModExp.modexp(alicePublic2048, bobPrivate2048, p2048);
const sharedTimeB = performance.now() - startSharedB;

console.log("\nShared secret computation:");
console.log("  Alice computed in", sharedTimeA.toFixed(2), "ms");
console.log("  Bob computed in", sharedTimeB.toFixed(2), "ms");
console.log("  Secrets match:", aliceSecret2048 === bobSecret2048);
console.log(
	"  Shared secret (hex, truncated):",
	aliceSecret2048.toString(16).slice(0, 40) + "...",
);

// === Three-Party DH (not secure, for demo only) ===
console.log("\n--- Three-Party Key Agreement ---");

const pThree = 97n; // Small prime for demo
const gThree = 5n;

// Three parties: Alice, Bob, Charlie
const aPriv = 7n;
const bPriv = 11n;
const cPriv = 13n;

// Round 1: Each computes g^x mod p
const A1 = ModExp.modexp(gThree, aPriv, pThree);
const B1 = ModExp.modexp(gThree, bPriv, pThree);
const C1 = ModExp.modexp(gThree, cPriv, pThree);

console.log("Round 1 (public values):");
console.log("  A = g^a mod p =", A1.toString());
console.log("  B = g^b mod p =", B1.toString());
console.log("  C = g^c mod p =", C1.toString());

// Round 2: Each computes (g^other)^self mod p
const A2 = ModExp.modexp(C1, aPriv, pThree); // g^(ac)
const B2 = ModExp.modexp(A1, bPriv, pThree); // g^(ab)
const C2 = ModExp.modexp(B1, cPriv, pThree); // g^(bc)

console.log("\nRound 2 (intermediate values):");
console.log("  Alice has g^(ac) =", A2.toString());
console.log("  Bob has g^(ab) =", B2.toString());
console.log("  Charlie has g^(bc) =", C2.toString());

// Round 3: Final shared key = g^(abc)
const keyA = ModExp.modexp(C2, aPriv, pThree); // (g^bc)^a = g^abc
const keyB = ModExp.modexp(A2, bPriv, pThree); // (g^ac)^b = g^abc
const keyC = ModExp.modexp(B2, cPriv, pThree); // (g^ab)^c = g^abc

console.log("\nFinal shared key:");
console.log("  Alice:", keyA.toString());
console.log("  Bob:", keyB.toString());
console.log("  Charlie:", keyC.toString());
console.log("  All match:", keyA === keyB && keyB === keyC);

// === Security Notes ===
console.log("\n=== Security Notes ===");
console.log("1. Use at least 2048-bit primes for security");
console.log("2. Private keys must be random (use crypto.getRandomValues)");
console.log("3. Classic DH is vulnerable to man-in-the-middle attacks");
console.log("4. Consider Elliptic Curve DH (ECDH) for better performance");
console.log("5. Always derive actual keys using a KDF (e.g., HKDF)");
