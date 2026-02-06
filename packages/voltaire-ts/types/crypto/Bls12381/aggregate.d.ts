/**
 * Aggregate multiple BLS signatures into one
 *
 * The aggregated signature can be verified against an aggregated public key
 * (when all signers signed the same message) or via batch verification
 * (when signers signed different messages).
 *
 * @param {Uint8Array[]} signatures - Array of compressed G1 signatures (48 bytes each)
 * @returns {Uint8Array} Aggregated signature (48 bytes compressed G1)
 * @throws {SignatureError} If aggregation fails or no signatures provided
 * @example
 * ```javascript
 * import { Bls12381 } from './crypto/Bls12381/index.js';
 *
 * const message = new TextEncoder().encode('Vote for proposal');
 *
 * const pk1 = Bls12381.randomPrivateKey();
 * const pk2 = Bls12381.randomPrivateKey();
 *
 * const sig1 = Bls12381.sign(message, pk1);
 * const sig2 = Bls12381.sign(message, pk2);
 *
 * const aggSig = Bls12381.aggregate([sig1, sig2]);
 * ```
 */
export function aggregate(signatures: Uint8Array[]): Uint8Array;
/**
 * Aggregate multiple public keys into one
 *
 * Used when multiple signers sign the same message and you want
 * to verify against a single aggregated public key.
 *
 * @param {Uint8Array[]} publicKeys - Array of compressed G2 public keys (96 bytes each)
 * @returns {Uint8Array} Aggregated public key (96 bytes compressed G2)
 * @throws {SignatureError} If aggregation fails or no public keys provided
 * @example
 * ```javascript
 * import { Bls12381 } from './crypto/Bls12381/index.js';
 *
 * const pk1 = Bls12381.randomPrivateKey();
 * const pk2 = Bls12381.randomPrivateKey();
 *
 * const pubKey1 = Bls12381.derivePublicKey(pk1);
 * const pubKey2 = Bls12381.derivePublicKey(pk2);
 *
 * const aggPubKey = Bls12381.aggregatePublicKeys([pubKey1, pubKey2]);
 * ```
 */
export function aggregatePublicKeys(publicKeys: Uint8Array[]): Uint8Array;
//# sourceMappingURL=aggregate.d.ts.map