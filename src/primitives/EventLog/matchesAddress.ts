import type { Address } from "../Address/index.js";
import type { Data } from "./EventLog.js";
import { addressEquals } from "./utils.js";

/**
 * Check if log matches address filter (standard form)
 */
export function matchesAddress<T extends Data>(
	log: T,
	filterAddress: Address | Address[],
): boolean {
	if (Array.isArray(filterAddress)) {
		return filterAddress.some((addr) => addressEquals(log.address, addr));
	}
	return addressEquals(log.address, filterAddress);
}
