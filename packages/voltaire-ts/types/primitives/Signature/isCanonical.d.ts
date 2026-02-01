/**
 * Check if ECDSA signature has canonical s-value (s <= n/2)
 *
 * For secp256k1 and p256, a signature is canonical if s <= curve_order / 2
 * This prevents signature malleability.
 *
 * @param {import('./SignatureType.js').SignatureType} signature - Signature to check
 * @returns {boolean} True if signature is canonical or Ed25519
 *
 * @example
 * ```typescript
 * if (!Signature.isCanonical(sig)) {
 *   sig = Signature.normalize(sig);
 * }
 * ```
 */
export function isCanonical(signature: import("./SignatureType.js").SignatureType): boolean;
//# sourceMappingURL=isCanonical.d.ts.map