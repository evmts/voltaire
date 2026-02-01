/**
 * Compare two ProtocolVersions for ordering
 * Returns negative if this < other, positive if this > other, 0 if equal
 *
 * Only compares versions within the same protocol family (e.g., eth/66 vs eth/67)
 * Returns 0 for different protocols
 *
 * @this {import('./ProtocolVersionType.js').ProtocolVersionType}
 * @param {import('./ProtocolVersionType.js').ProtocolVersionType} other - Protocol version to compare
 * @returns {number} Comparison result (-1, 0, or 1)
 *
 * @example
 * ```javascript
 * import * as ProtocolVersion from './primitives/ProtocolVersion/index.js';
 * const v66 = ProtocolVersion.from("eth/66");
 * const v67 = ProtocolVersion.from("eth/67");
 * const result = ProtocolVersion._compare.call(v66, v67); // -1
 * ```
 */
export function compare(this: import("./ProtocolVersionType.js").ProtocolVersionType, other: import("./ProtocolVersionType.js").ProtocolVersionType): number;
//# sourceMappingURL=compare.d.ts.map