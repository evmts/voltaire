import { Hash } from "../Hash/index.js";
/**
 * @typedef {import('./StateRootType.js').StateRootType} StateRootType
 */
/**
 * Compares two StateRoots for equality.
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param {StateRootType} a - First StateRoot
 * @param {StateRootType} b - Second StateRoot
 * @returns {boolean} - True if equal
 *
 * @example
 * ```typescript
 * const isEqual = StateRoot.equals(root1, root2);
 * ```
 */
export function equals(a, b) {
    return Hash.equals(
    /** @type {import('../Hash/HashType.js').HashType} */ (
    /** @type {unknown} */ (a)), 
    /** @type {import('../Hash/HashType.js').HashType} */ (
    /** @type {unknown} */ (b)));
}
