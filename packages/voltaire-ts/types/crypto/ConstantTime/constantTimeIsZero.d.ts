/**
 * Check in constant time whether every byte is zero.
 *
 * The running time depends only on the length of the input. Use it for zero
 * checks on secret values such as private keys and ECDH shared secrets
 * (RFC 7748 section 6.1), where an early exit would leak the number of
 * leading zero bytes.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Bytes to check
 * @returns {boolean} True if every byte is zero (also true for empty input)
 * @throws {never}
 * @example
 * ```javascript
 * import { constantTimeIsZero } from './crypto/ConstantTime/index.js';
 * if (constantTimeIsZero(sharedSecret)) throw new Error('weak public key');
 * ```
 */
export function constantTimeIsZero(bytes: Uint8Array): boolean;
//# sourceMappingURL=constantTimeIsZero.d.ts.map