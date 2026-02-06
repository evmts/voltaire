/**
 * BLS12-381 Elliptic Curve Cryptography
 *
 * Pairing-friendly curve for Ethereum consensus layer signatures.
 *
 * Provides high-level BLS signature operations (sign, verify, aggregate)
 * as well as low-level curve operations (G1, G2, pairing).
 *
 * @example
 * ```typescript
 * import { Bls12381 } from './crypto/Bls12381/index.js';
 *
 * // High-level BLS signatures
 * const privateKey = Bls12381.randomPrivateKey();
 * const publicKey = Bls12381.derivePublicKey(privateKey);
 * const message = new TextEncoder().encode('Hello, Ethereum!');
 * const signature = Bls12381.sign(message, privateKey);
 * const isValid = Bls12381.verify(signature, message, publicKey);
 *
 * // Signature aggregation
 * const aggSig = Bls12381.aggregate([sig1, sig2]);
 * const valid = Bls12381.aggregateVerify(aggSig, message, [pubKey1, pubKey2]);
 *
 * // Low-level curve operations
 * const g1Point = Bls12381.G1.generator();
 * const g2Point = Bls12381.G2.generator();
 * ```
 */
export * from "./Bls12381.js";
