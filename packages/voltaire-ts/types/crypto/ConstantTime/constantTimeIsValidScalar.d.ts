/**
 * Check in constant time that a big-endian scalar is in the valid range
 * `[1, upperBound)` (i.e., non-zero and strictly less than `upperBound`).
 *
 * Performs a single full pass from least-significant byte to most-significant
 * byte, accumulating both a non-zero bitmask and an unsigned subtraction borrow
 * without any data-dependent early exit. Lengths are public and must match.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} scalar - Big-endian scalar bytes to validate
 * @param {Uint8Array} upperBound - Big-endian exclusive upper bound (e.g. curve order)
 * @returns {boolean} True if `0 < scalar < upperBound`
 * @throws {never}
 * @example
 * ```javascript
 * import { constantTimeIsValidScalar } from './crypto/ConstantTime/index.js';
 * const valid = constantTimeIsValidScalar(privateKey, curveOrderBytes);
 * ```
 */
export function constantTimeIsValidScalar(scalar: Uint8Array, upperBound: Uint8Array): boolean;
//# sourceMappingURL=constantTimeIsValidScalar.d.ts.map