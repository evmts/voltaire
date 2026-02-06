import { SIZE } from "./constants.js";
/**
 * Create Bytes32 from number (big-endian, zero-padded)
 *
 * @param {number} value - Number to convert
 * @returns {import('./Bytes32Type.js').Bytes32Type} Bytes32
 *
 * @example
 * ```typescript
 * const b32 = Bytes32.fromNumber(42);
 * // Last byte is 42, rest are zeros
 * ```
 */
export function fromNumber(value) {
    const result = new Uint8Array(SIZE);
    let n = value;
    let i = SIZE - 1;
    while (n > 0 && i >= 0) {
        result[i] = n & 0xff;
        n = Math.floor(n / 256);
        i--;
    }
    return /** @type {import('./Bytes32Type.js').Bytes32Type} */ (result);
}
