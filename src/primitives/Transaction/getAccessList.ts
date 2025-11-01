import { isLegacy } from "./typeGuards.js";
import type { Any, AccessList } from "./types.js";

/**
 * Get access list (empty for legacy transactions)
 */
export function getAccessList(tx: Any): AccessList {
	if (isLegacy(tx)) {
		return [];
	}
	return tx.accessList;
}
