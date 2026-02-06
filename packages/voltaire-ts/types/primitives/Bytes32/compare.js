import { SIZE } from "./constants.js";
/**
 * Compare two Bytes32 values lexicographically
 *
 * @param {import('./Bytes32Type.js').Bytes32Type} a - First Bytes32
 * @param {import('./Bytes32Type.js').Bytes32Type} b - Second Bytes32
 * @returns {number} -1 if a < b, 0 if equal, 1 if a > b
 *
 * @example
 * ```typescript
 * const sorted = bytes32Array.sort(Bytes32.compare);
 * ```
 */
export function compare(a, b) {
    for (let i = 0; i < SIZE; i++) {
        const aByte = a[i] ?? 0;
        const bByte = b[i] ?? 0;
        if (aByte < bByte)
            return -1;
        if (aByte > bByte)
            return 1;
    }
    return 0;
}
