import { isLegacy } from "./typeGuards.js";
import type { Any, AccessList } from "./types.js";

/**
 * Get access list (empty for legacy transactions)
 */
export function getAccessList(this: Any): AccessList {
	if (isLegacy(this)) {
		return [];
	}
	return this.accessList;
}
