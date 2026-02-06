import { SIZE } from "./constants.js";
/**
 * Perform bitwise XOR on two Bytes32 values
 *
 * @param {import('./Bytes32Type.js').Bytes32Type} a - First Bytes32
 * @param {import('./Bytes32Type.js').Bytes32Type} b - Second Bytes32
 * @returns {import('./Bytes32Type.js').Bytes32Type} Result of a ^ b
 *
 * @example
 * ```typescript
 * const result = Bytes32.bitwiseXor(a, b);
 * ```
 */
export function bitwiseXor(a, b) {
    const result = new Uint8Array(SIZE);
    for (let i = 0; i < SIZE; i++) {
        result[i] = /** @type {number} */ (a[i]) ^ /** @type {number} */ (b[i]);
    }
    return /** @type {import('./Bytes32Type.js').Bytes32Type} */ (result);
}
