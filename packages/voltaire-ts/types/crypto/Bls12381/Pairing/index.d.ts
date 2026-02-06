/**
 * Pairing check: verify that product of pairings equals identity
 * e(P1, Q1) * e(P2, Q2) * ... * e(Pn, Qn) = 1
 *
 * This is the core operation used in BLS signature verification.
 *
 * @param {Array<[import('../G1PointType.js').G1PointType, import('../G2PointType.js').G2PointType]>} pairs - Array of (G1, G2) point pairs
 * @returns {boolean} True if pairing product equals identity
 * @throws {PairingError} If any point is invalid
 */
export function pairingCheck(pairs: Array<[import("../G1PointType.js").G1PointType, import("../G2PointType.js").G2PointType]>): boolean;
/**
 * Compute single pairing e(P, Q)
 *
 * @param {import('../G1PointType.js').G1PointType} p - G1 point
 * @param {import('../G2PointType.js').G2PointType} q - G2 point
 * @returns {never} Throws - not implemented in pure JS
 * @throws {PairingError}
 */
export function pair(p: import("../G1PointType.js").G1PointType, q: import("../G2PointType.js").G2PointType): never;
/**
 * Verify BLS signature using pairing check
 * Verifies: e(signature, G2_generator) = e(H(message), publicKey)
 * Equivalent to: e(signature, G2_gen) * e(-H(msg), pubKey) = 1
 *
 * @param {import('../G1PointType.js').G1PointType} signature - Signature (G1 point)
 * @param {import('../G2PointType.js').G2PointType} publicKey - Public key (G2 point)
 * @param {import('../G1PointType.js').G1PointType} messagePoint - Hashed message (G1 point)
 * @returns {boolean} True if signature is valid
 * @throws {PairingError}
 */
export function verifySignature(signature: import("../G1PointType.js").G1PointType, publicKey: import("../G2PointType.js").G2PointType, messagePoint: import("../G1PointType.js").G1PointType): boolean;
/**
 * Verify aggregate BLS signature (same message)
 * All signers signed the same message.
 *
 * @param {import('../G1PointType.js').G1PointType} aggregatedSignature - Aggregated signature (G1 point)
 * @param {import('../G2PointType.js').G2PointType} aggregatedPublicKey - Aggregated public key (G2 point)
 * @param {import('../G1PointType.js').G1PointType} messagePoint - Hashed message (G1 point)
 * @returns {boolean} True if aggregate signature is valid
 * @throws {PairingError}
 */
export function verifyAggregateSignature(aggregatedSignature: import("../G1PointType.js").G1PointType, aggregatedPublicKey: import("../G2PointType.js").G2PointType, messagePoint: import("../G1PointType.js").G1PointType): boolean;
/**
 * Batch verify multiple BLS signatures on different messages
 *
 * @param {Array<{signature: import('../G1PointType.js').G1PointType, publicKey: import('../G2PointType.js').G2PointType, messagePoint: import('../G1PointType.js').G1PointType}>} items - Array of signature verification items
 * @returns {boolean} True if all signatures are valid
 * @throws {PairingError}
 */
export function batchVerify(items: Array<{
    signature: import("../G1PointType.js").G1PointType;
    publicKey: import("../G2PointType.js").G2PointType;
    messagePoint: import("../G1PointType.js").G1PointType;
}>): boolean;
//# sourceMappingURL=index.d.ts.map