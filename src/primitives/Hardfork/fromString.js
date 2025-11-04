import { NAME_TO_HARDFORK } from "./constants.js";

/**
 * Parse hardfork from string name (case-insensitive)
 * Supports both standard names and common variations
 *
 * @param {string} name - Hardfork name (e.g., "Cancun", ">=Berlin")
 * @returns {import('./BrandedHardfork.js').BrandedHardfork | undefined} Hardfork or undefined if invalid
 *
 * @example
 * ```typescript
 * import { fromString } from './hardfork.js';
 *
 * const fork = fromString("cancun"); // CANCUN
 * const fork2 = fromString("Paris"); // MERGE
 * const invalid = fromString("unknown"); // undefined
 * ```
 */
export function fromString(name) {
	// Handle comparisons like ">=Cancun" or ">Berlin"
	let cleanName = name;
	if (name.length > 0 && (name[0] === ">" || name[0] === "<")) {
		const start = name.length > 1 && name[1] === "=" ? 2 : 1;
		cleanName = name.substring(start);
	}

	// Case-insensitive comparison
	const lower = cleanName.toLowerCase();
	return NAME_TO_HARDFORK[lower];
}
