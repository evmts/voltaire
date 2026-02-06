/**
 * Format an ABI item with arguments as a human-readable string
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @param {import('./AbiType.js').Item} item - ABI item to format
 * @param {readonly unknown[]} args - Arguments to display
 * @returns {string} Formatted string with arguments
 * @throws {never}
 * @example
 * ```javascript
 * import * as Abi from './primitives/Abi/index.js';
 * const formatted = Abi.Item.formatWithArgs(
 *   { type: 'function', name: 'transfer', inputs: [{ type: 'address' }, { type: 'uint256' }] },
 *   ['0x123...', 100n]
 * );
 * // => "transfer(0x123..., 100)"
 * ```
 */
export function formatWithArgs(item: import("./AbiType.js").Item, args: readonly unknown[]): string;
//# sourceMappingURL=formatWithArgs.d.ts.map