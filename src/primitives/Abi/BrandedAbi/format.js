// @ts-nocheck

/**
 * Format an ABI item as a human-readable string
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @param {import('./BrandedAbi.js').Item} item - ABI item to format
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
export function format(item) {
	if (!("name" in item)) {
		return item.type;
	}

	const inputs =
		"inputs" in item
			? item.inputs
					.map((p) => `${p.type}${p.name ? ` ${p.name}` : ""}`)
					.join(", ")
			: "";

	let result = `${item.type} ${item.name}(${inputs})`;

	if (item.type === "function" && item.outputs.length > 0) {
		const outputs = item.outputs.map((p) => p.type).join(", ");
		result += ` returns (${outputs})`;
	}

	if ("stateMutability" in item && item.stateMutability !== "nonpayable") {
		result += ` ${item.stateMutability}`;
	}

	return result;
}
