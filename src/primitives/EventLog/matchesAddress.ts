import type { BrandedAddress } from "../Address/index.js";
import type { BrandedEventLog } from "./BrandedEventLog.js";
import { addressEquals } from "./utils.js";

/**
 * Check if log matches address filter
 *
 * @param log Event log to check
 * @param filterAddress Address or array of addresses to match
 * @returns True if log matches address filter
 *
 * @example
 * ```typescript
 * const log = EventLog.create({ ... });
 * const matches1 = EventLog.matchesAddress(log, "0x..." as Address);
 * const matches2 = log.matchesAddress("0x..." as Address);
 * ```
 */
export function matchesAddress<T extends BrandedEventLog>(
	log: T,
	filterAddress: Address | BrandedAddress[],
): boolean {
	if (Array.isArray(filterAddress)) {
		return filterAddress.some((addr) => addressEquals(log.address, addr));
	}
	return addressEquals(log.address, filterAddress);
}
