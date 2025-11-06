import { format } from "./format.js";

/**
 * Format an ABI item with concrete argument values
 * @param {import('./BrandedItem.js').BrandedItem} item - The item to format
 * @param {readonly unknown[]} args - The argument values
 * @returns {string}
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
