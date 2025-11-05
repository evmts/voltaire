// @ts-nocheck

/**
 * Format an ABI item as a human-readable string
 *
 * @param {import('./BrandedAbi.js').Item} item - ABI item to format
 * @returns {string} Formatted string representation
 *
 * @example
 * format({ type: 'function', name: 'transfer', inputs: [...], outputs: [...] })
 * // => "function transfer(address to, uint256 amount) returns (bool)"
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
