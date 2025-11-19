import * as Address from "../Address/internal-index.js";

/**
 * Check if two EntryPoint addresses are equal
 *
 * @param {import('./EntryPointType.js').EntryPointType} a - First EntryPoint
 * @param {import('./EntryPointType.js').EntryPointType} b - Second EntryPoint
 * @returns {boolean} True if addresses are equal
 *
 * @example
 * ```typescript
 * const isEqual = EntryPoint.equals(entryPoint1, entryPoint2);
 * ```
 */
export function equals(a, b) {
	return Address.equals(a, b);
}
