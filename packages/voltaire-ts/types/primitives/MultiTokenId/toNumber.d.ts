/**
 * Convert MultiTokenId to number (unsafe for large values)
 *
 * @see https://voltaire.tevm.sh/primitives/multi-token-id for MultiTokenId documentation
 * @since 0.0.0
 * @param {import('./MultiTokenIdType.js').MultiTokenIdType} tokenId - MultiTokenId value to convert
 * @returns {number} number value
 * @throws {RangeError} If value exceeds Number.MAX_SAFE_INTEGER
 * @example
 * ```javascript
 * import * as MultiTokenId from './primitives/MultiTokenId/index.js';
 * const tokenId = MultiTokenId.from(1n);
 * const num = MultiTokenId.toNumber(tokenId); // 1
 * ```
 */
export function toNumber(tokenId: import("./MultiTokenIdType.js").MultiTokenIdType): number;
//# sourceMappingURL=toNumber.d.ts.map