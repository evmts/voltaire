/**
 * Create NetworkId from number
 *
 * @param {number} value - Network ID number
 * @returns {import('./NetworkIdType.js').NetworkIdType} Branded network ID
 * @throws {InvalidFormatError} If value is not a non-negative integer
 *
 * @example
 * ```javascript
 * import * as NetworkId from './primitives/NetworkId/index.js';
 * const mainnet = NetworkId.from(1);
 * const sepolia = NetworkId.from(11155111);
 * ```
 */
export function from(value: number): import("./NetworkIdType.js").NetworkIdType;
//# sourceMappingURL=from.d.ts.map