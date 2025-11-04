import type { BrandedAccessList } from "./BrandedAccessList.js";

/**
 * Create empty access list
 *
 * @returns Empty access list
 *
 * @example
 * ```typescript
 * const list = AccessList.create();
 * ```
 */
export function create(): BrandedAccessList {
	return [] as BrandedAccessList;
}
