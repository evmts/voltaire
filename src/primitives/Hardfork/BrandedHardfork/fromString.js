import { NAME_TO_HARDFORK } from "./constants.js";

/**
 * Parse hardfork from string name (case-insensitive)
 * Supports both standard names and common variations
 *
 * @see https://voltaire.tevm.sh/primitives/hardfork for Hardfork documentation
 * @since 0.0.0
 * @param {string} name - Hardfork name (e.g., "Cancun", ">=Berlin")
 * @returns {import('./BrandedHardfork.js').BrandedHardfork | undefined} Hardfork or undefined if invalid
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hardfork from './primitives/Hardfork/index.js';
 *
 * const fork = Hardfork.fromString("cancun"); // CANCUN
 * const fork2 = Hardfork.fromString("Paris"); // MERGE
 * const invalid = Hardfork.fromString("unknown"); // undefined
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
	return /** @type {import('./BrandedHardfork.js').BrandedHardfork | undefined} */ (
		NAME_TO_HARDFORK[/** @type {keyof typeof NAME_TO_HARDFORK} */ (lower)]
	);
}
