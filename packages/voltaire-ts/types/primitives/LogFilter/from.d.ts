/**
 * Create LogFilter from parameters
 *
 * @param {Partial<import('./LogFilterType.js').LogFilterType>} params - Filter parameters
 * @returns {import('./LogFilterType.js').LogFilterType}
 * @throws {InvalidLogFilterError}
 * @example
 * ```javascript
 * import * as LogFilter from './primitives/LogFilter/index.js';
 * import * as Address from './primitives/Address/index.js';
 * import * as BlockNumber from './primitives/BlockNumber/index.js';
 *
 * // Filter by address and block range
 * const filter = LogFilter.from({
 *   fromBlock: BlockNumber.from(1000000),
 *   toBlock: "latest",
 *   address: Address.from("0x...")
 * });
 *
 * // Filter by specific block hash
 * const filter2 = LogFilter.from({
 *   blockhash: Hash.from("0x..."),
 *   address: Address.from("0x...")
 * });
 * ```
 */
export function from(params: Partial<import("./LogFilterType.js").LogFilterType>): import("./LogFilterType.js").LogFilterType;
//# sourceMappingURL=from.d.ts.map