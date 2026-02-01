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

// Public parameters (use much larger in production!)
const pSmall = 23n; // Prime modulus
const gSmall = 5n; // Generator

// Alice generates her key pair
const alicePrivateSmall = 6n;
const alicePublicSmall = ModExp.modexp(gSmall, alicePrivateSmall, pSmall);

// Bob generates his key pair
const bobPrivateSmall = 15n;
const bobPublicSmall = ModExp.modexp(gSmall, bobPrivateSmall, pSmall);

// Both compute the shared secret
const aliceSecretSmall = ModExp.modexp(
	bobPublicSmall,
	alicePrivateSmall,
	pSmall,
);
const bobSecretSmall = ModExp.modexp(alicePublicSmall, bobPrivateSmall, pSmall);

// 2048-bit MODP Group (Group 14 from RFC 3526)
const p2048 =
	0xffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece45b3dc2007cb8a163bf0598da48361c55d39a69163fa8fd24cf5f83655d23dca3ad961c62f356208552bb9ed529077096966d670c354e4abc9804f1746c08ca18217c32905e462e36ce3be39e772c180e86039b2783a2ec07a28fb5c55df06f4c52c9de2bcbf6955817183995497cea956ae515d2261898fa051015728e5a8aacaa68ffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000n;

const g2048 = 2n;

// Simulate random private keys (in production, use cryptographically secure random)
const alicePrivate2048 =
	0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefn;
const bobPrivate2048 =
	0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321n;

const startAlice = performance.now();
const alicePublic2048 = ModExp.modexp(g2048, alicePrivate2048, p2048);
const aliceTime = performance.now() - startAlice;

const startBob = performance.now();
const bobPublic2048 = ModExp.modexp(g2048, bobPrivate2048, p2048);
const bobTime = performance.now() - startBob;

// Compute shared secrets
const startSharedA = performance.now();
const aliceSecret2048 = ModExp.modexp(bobPublic2048, alicePrivate2048, p2048);
const sharedTimeA = performance.now() - startSharedA;

const startSharedB = performance.now();
const bobSecret2048 = ModExp.modexp(alicePublic2048, bobPrivate2048, p2048);
const sharedTimeB = performance.now() - startSharedB;

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

// Round 2: Each computes (g^other)^self mod p
const A2 = ModExp.modexp(C1, aPriv, pThree); // g^(ac)
const B2 = ModExp.modexp(A1, bPriv, pThree); // g^(ab)
const C2 = ModExp.modexp(B1, cPriv, pThree); // g^(bc)

// Round 3: Final shared key = g^(abc)
const keyA = ModExp.modexp(C2, aPriv, pThree); // (g^bc)^a = g^abc
const keyB = ModExp.modexp(A2, bPriv, pThree); // (g^ac)^b = g^abc
const keyC = ModExp.modexp(B2, cPriv, pThree); // (g^ab)^c = g^abc
