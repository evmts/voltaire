/**
 * Format an ABI item as a human-readable string
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @param {import('./AbiType.js').Item} item - ABI item to format
 * @returns {string} Formatted string representation
 * @throws {never}
 * @example
 * ```javascript
 * import * as Abi from './primitives/Abi/index.js';
 * const formatted = Abi.Item.format({
 *   type: 'function',
 *   name: 'transfer',
 *   inputs: [{ type: 'address', name: 'to' }, { type: 'uint256', name: 'amount' }],
 *   outputs: [{ type: 'bool' }]
 * });
 * // => "function transfer(address to, uint256 amount) returns (bool)"
 * ```
 */
export function format(item: import("./AbiType.js").Item): string;
//# sourceMappingURL=format.d.ts.map