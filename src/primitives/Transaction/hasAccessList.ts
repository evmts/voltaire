import { isLegacy } from "./typeGuards.js";
import type { Any } from "./types.js";

/**
 * Check if transaction has access list
 */
export function hasAccessList(this: Any): boolean {
	return !isLegacy(this);
}
