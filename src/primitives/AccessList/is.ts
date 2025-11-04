import type { BrandedAccessList } from "./BrandedAccessList.js";
import { isItem } from "./isItem.js";

/**
 * Type guard: Check if value is AccessList
 *
 * @param value - Value to check
 * @returns true if value is AccessList
 *
 * @example
 * ```typescript
 * if (AccessList.is(value)) {
 *   const cost = AccessList.gasCost(value);
 * }
 * ```
 */
export function is(value: unknown): value is BrandedAccessList {
	return Array.isArray(value) && value.every(isItem);
}
