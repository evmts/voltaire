/**
 * Convert NetworkId to number (identity function for branded type)
 *
 * @this {import('./NetworkIdType.js').NetworkIdType}
 * @returns {number} Network ID as number
 *
 * @example
 * ```javascript
 * import * as NetworkId from './primitives/NetworkId/index.js';
 * const netId = NetworkId.from(1);
 * const num = NetworkId._toNumber.call(netId); // 1
 * ```
 */
export function toNumber(this: import("./NetworkIdType.js").NetworkIdType): number;
//# sourceMappingURL=toNumber.d.ts.map