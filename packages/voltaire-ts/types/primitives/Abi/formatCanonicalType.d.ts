/**
 * Format a parameter type to its canonical form for signature generation.
 * Expands tuple types to their component types, e.g., "tuple" -> "(uint256,address)"
 *
 * @param {import('./Parameter.js').Parameter} param - ABI parameter
 * @returns {string} Canonical type string
 *
 * @example
 * ```typescript
 * // Simple type
 * formatCanonicalType({ type: "address", name: "to" });
 * // "address"
 *
 * // Tuple type
 * formatCanonicalType({
 *   type: "tuple",
 *   name: "data",
 *   components: [
 *     { type: "address", name: "addr" },
 *     { type: "uint256", name: "value" }
 *   ]
 * });
 * // "(address,uint256)"
 *
 * // Tuple array
 * formatCanonicalType({
 *   type: "tuple[]",
 *   name: "items",
 *   components: [
 *     { type: "address", name: "addr" },
 *     { type: "uint256", name: "value" }
 *   ]
 * });
 * // "(address,uint256)[]"
 * ```
 */
export function formatCanonicalType(param: import("./Parameter.js").Parameter): string;
//# sourceMappingURL=formatCanonicalType.d.ts.map