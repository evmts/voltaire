import { compare } from "./compare.js";
/**
 * Return the minimum of two Bytes32 values (lexicographically)
 *
 * @param {import('./Bytes32Type.js').Bytes32Type} a - First Bytes32
 * @param {import('./Bytes32Type.js').Bytes32Type} b - Second Bytes32
 * @returns {import('./Bytes32Type.js').Bytes32Type} The smaller value
 *
 * @example
 * ```typescript
 * const smaller = Bytes32.min(a, b);
 * ```
 */
export function min(a, b) {
    return compare(a, b) <= 0 ? a : b;
}
