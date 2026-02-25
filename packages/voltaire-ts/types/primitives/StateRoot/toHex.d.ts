/**
 * @typedef {import('./StateRootType.js').StateRootType} StateRootType
 */
/**
 * Converts a StateRoot to a hex string.
 *
 * @param {StateRootType} stateRoot - The StateRoot to convert
 * @returns {import('../Hex/HexType.js').HexType} - Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const hex = StateRoot.toHex(root);
 * // "0x1234..."
 * ```
 */
export function toHex(stateRoot: StateRootType): import("../Hex/HexType.js").HexType;
export type StateRootType = import("./StateRootType.js").StateRootType;
//# sourceMappingURL=toHex.d.ts.map