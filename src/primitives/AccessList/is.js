import { isItem } from "./isItem.js";

/**
 * Type guard: Check if value is AccessList (EIP-2930)
 *
 * @param {unknown} value - Value to check
 * @returns {value is import('./BrandedAccessList.js').BrandedAccessList} true if value is AccessList
 *
 * @example
 * ```typescript
 * if (AccessList.is(value)) {
 *   const cost = AccessList.gasCost(value);
 * }
 * ```
 */
export function is(value) {
	return Array.isArray(value) && value.every(isItem);
}
