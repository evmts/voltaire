import { equalsConstantTime } from "../Bytes/equalsConstantTime.js";
/**
 * Check if two signatures are equal using constant-time comparison
 *
 * Uses constant-time comparison to prevent timing attacks when comparing
 * signature data. The algorithm and v value comparisons are also timing-safe
 * as they branch on fixed, public metadata.
 *
 * @param {import('./SignatureType.js').SignatureType} a - First signature
 * @param {import('./SignatureType.js').SignatureType} b - Second signature
 * @returns {boolean} True if signatures are equal
 *
 * @example
 * ```typescript
 * const isEqual = Signature.equals(sig1, sig2);
 * ```
 */
export function equals(a, b) {
    // Check algorithm match (safe - algorithm is public metadata)
    if (a.algorithm !== b.algorithm) {
        return false;
    }
    // Check v for secp256k1 (safe - v is public metadata)
    if (a.algorithm === "secp256k1" && a.v !== b.v) {
        return false;
    }
    // Use constant-time comparison for the actual signature bytes
    return equalsConstantTime(a, b);
}
