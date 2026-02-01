/**
 * @typedef {import('./StateRootType.js').StateRootType} StateRootType
 * @typedef {import('./StateRootType.js').StateRootLike} StateRootLike
 */
/**
 * Creates a StateRoot from various input types.
 * Accepts hex strings, Uint8Array, or existing StateRoot instances.
 *
 * @param {StateRootLike} value - The value to convert
 * @returns {StateRootType} - A branded StateRoot
 *
 * @example
 * ```typescript
 * const root = StateRoot.from("0x1234...");
 * const root2 = StateRoot.from(new Uint8Array(32));
 * ```
 */
export function from(value: StateRootLike): StateRootType;
export type StateRootType = import("./StateRootType.js").StateRootType;
export type StateRootLike = import("./StateRootType.js").StateRootLike;
//# sourceMappingURL=from.d.ts.map