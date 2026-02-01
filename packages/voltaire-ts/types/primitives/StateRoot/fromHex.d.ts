/**
 * @typedef {import('./StateRootType.js').StateRootType} StateRootType
 */
/**
 * Creates a StateRoot from a hex string.
 *
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {StateRootType} - A branded StateRoot
 *
 * @example
 * ```typescript
 * const root = StateRoot.fromHex("0x1234...");
 * ```
 */
export function fromHex(hex: string): StateRootType;
export type StateRootType = import("./StateRootType.js").StateRootType;
//# sourceMappingURL=fromHex.d.ts.map