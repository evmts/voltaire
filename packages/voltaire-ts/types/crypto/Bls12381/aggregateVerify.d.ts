/**
 * Verify an aggregated signature where all signers signed the same message
 *
 * This is the most common case in Ethereum consensus - multiple validators
 * sign the same block/attestation.
 *
 * @param {Uint8Array} aggregatedSignature - Aggregated signature (96 bytes)
 * @param {Uint8Array} message - The message that was signed by all parties
 * @param {Uint8Array[]} publicKeys - Public keys of all signers (48 bytes each)
 * @returns {boolean} True if the aggregated signature is valid
 * @example
 * ```javascript
 * import { Bls12381 } from './crypto/Bls12381/index.js';
 *
 * const message = new TextEncoder().encode('Block attestation');
 *
 * const pk1 = Bls12381.randomPrivateKey();
 * const pk2 = Bls12381.randomPrivateKey();
 * const pubKey1 = Bls12381.derivePublicKey(pk1);
 * const pubKey2 = Bls12381.derivePublicKey(pk2);
 *
 * const sig1 = Bls12381.sign(message, pk1);
 * const sig2 = Bls12381.sign(message, pk2);
 * const aggSig = Bls12381.aggregate([sig1, sig2]);
 *
 * const isValid = Bls12381.aggregateVerify(aggSig, message, [pubKey1, pubKey2]);
 * console.log(isValid); // true
 * ```
 */
export function aggregateVerify(aggregatedSignature: Uint8Array, message: Uint8Array, publicKeys: Uint8Array[]): boolean;
/**
 * Verify an aggregated signature where each signer signed a different message
 *
 * Uses multi-pairing verification: product of e(pk_i, H(msg_i)) == e(G1, aggSig)
 *
 * @param {Uint8Array} aggregatedSignature - Aggregated signature (96 bytes)
 * @param {Uint8Array[]} messages - Messages that were signed (one per signer)
 * @param {Uint8Array[]} publicKeys - Public keys (one per signer, same order as messages)
 * @returns {boolean} True if the aggregated signature is valid
 * @throws {SignatureError} If messages and publicKeys have different lengths
 * @example
 * ```javascript
 * import { Bls12381 } from './crypto/Bls12381/index.js';
 *
 * const pk1 = Bls12381.randomPrivateKey();
 * const pk2 = Bls12381.randomPrivateKey();
 * const pubKey1 = Bls12381.derivePublicKey(pk1);
 * const pubKey2 = Bls12381.derivePublicKey(pk2);
 *
 * const msg1 = new TextEncoder().encode('Message 1');
 * const msg2 = new TextEncoder().encode('Message 2');
 *
 * const sig1 = Bls12381.sign(msg1, pk1);
 * const sig2 = Bls12381.sign(msg2, pk2);
 * const aggSig = Bls12381.aggregate([sig1, sig2]);
 *
 * const isValid = Bls12381.batchVerify(aggSig, [msg1, msg2], [pubKey1, pubKey2]);
 * console.log(isValid); // true
 * ```
 */
export function batchVerify(aggregatedSignature: Uint8Array, messages: Uint8Array[], publicKeys: Uint8Array[]): boolean;
/**
 * Fast aggregate verify (same message case)
 *
 * Optimized for the common case where all signers signed the same message.
 * This is faster than aggregateVerify when you already have the aggregated public key.
 *
 * @param {Uint8Array} aggregatedSignature - Aggregated signature (96 bytes)
 * @param {Uint8Array} message - The message that was signed
 * @param {Uint8Array} aggregatedPublicKey - Pre-computed aggregated public key (48 bytes)
 * @returns {boolean} True if valid
 */
export function fastAggregateVerify(aggregatedSignature: Uint8Array, message: Uint8Array, aggregatedPublicKey: Uint8Array): boolean;
//# sourceMappingURL=aggregateVerify.d.ts.map