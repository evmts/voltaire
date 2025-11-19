import * as Address from "../Address/internal-index.js";

/**
 * Create EntryPoint from address input
 *
 * @param {number | bigint | string | Uint8Array | import('../Address/AddressType.js').AddressType} value - Address value
 * @returns {import('./EntryPointType.js').EntryPointType} EntryPoint address
 * @throws {Error} If address format is invalid
 *
 * @example
 * ```typescript
 * const entryPoint = EntryPoint.from("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789");
 * const entryPoint2 = EntryPoint.from(ENTRYPOINT_V07);
 * ```
 */
export function from(value) {
	const addr = Address.from(value);
	return /** @type {import('./EntryPointType.js').EntryPointType} */ (addr);
}
