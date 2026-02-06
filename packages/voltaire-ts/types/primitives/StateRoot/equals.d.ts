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
export function equals(a: StateRootType, b: StateRootType): boolean;
export type StateRootType = import("./StateRootType.js").StateRootType;
//# sourceMappingURL=equals.d.ts.map