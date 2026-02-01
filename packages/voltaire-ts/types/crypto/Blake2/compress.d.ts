/**
 * BLAKE2b F compression function (EIP-152 format)
 *
 * @param {Uint8Array} input - 213-byte input in EIP-152 format
 * @returns {Uint8Array} 64-byte output (updated state)
 * @throws {Blake2InvalidInputLengthError} If input length is not 213 bytes
 *
 * @example
 * ```javascript
 * import { compress } from './crypto/Blake2/compress.js';
 *
 * const input = new Uint8Array(213);
 * // ... fill input with rounds, h, m, t, f
 * const output = compress(input);
 * ```
 */
export function compress(input: Uint8Array): Uint8Array;
export default compress;
//# sourceMappingURL=compress.d.ts.map