/**
 * Check if log matches address filter
 *
 * @param {import('../EventLogType.js').BrandedEventLog} log
 * @param {import('../../Address/AddressType.js').AddressType | import('../../Address/AddressType.js').AddressType[]} filterAddress
 * @returns {boolean}
 *
 * @example
 * ```typescript
 * import { matchesAddress } from './extensions'
 * const matches = matchesAddress(log, "0x..." as Address)
 * ```
 */
export function matchesAddress(log: import("../EventLogType.js").BrandedEventLog, filterAddress: import("../../Address/AddressType.js").AddressType | import("../../Address/AddressType.js").AddressType[]): boolean;
//# sourceMappingURL=matchesAddress.d.ts.map