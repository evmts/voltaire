// @ts-nocheck
import { format } from "./format.js";

/**
 * Format an ABI item with arguments as a human-readable string
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @param {import('./BrandedAbi.js').Item} item - ABI item to format
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
export function formatWithArgs(item, args) {
	if (!("name" in item) || !("inputs" in item)) {
		return format(item);
	}

	const formattedArgs = args
		.map((arg, i) => {
			void item.inputs[i];
			return String(arg);
		})
		.join(", ");

	return `${item.name}(${formattedArgs})`;
}
