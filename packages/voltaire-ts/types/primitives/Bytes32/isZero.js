import { SIZE } from "./constants.js";
/**
 * Check if Bytes32 is all zeros
 *
 * @param {import('./Bytes32Type.js').Bytes32Type} bytes32 - Bytes32 to check
 * @returns {boolean} True if all bytes are zero
 *
 * @example
 * ```typescript
 * if (Bytes32.isZero(b32)) {
 *   console.log("Empty slot");
 * }
 * ```
 */
export function isZero(bytes32) {
    for (let i = 0; i < SIZE; i++) {
        if (bytes32[i] !== 0)
            return false;
    }
    return true;
}
