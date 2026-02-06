/**
 * Convert MultiTokenId to bigint
 *
 * @see https://voltaire.tevm.sh/primitives/multi-token-id for MultiTokenId documentation
 * @since 0.0.0
 * @param {import('./MultiTokenIdType.js').MultiTokenIdType} tokenId - MultiTokenId value to convert
 * @returns {bigint} bigint value
 * @example
 * ```javascript
 * import * as MultiTokenId from './primitives/MultiTokenId/index.js';
 * const tokenId = MultiTokenId.from(1n);
 * const bigint = MultiTokenId.toBigInt(tokenId); // 1n
 * ```
 */
export function toBigInt(tokenId: import("./MultiTokenIdType.js").MultiTokenIdType): bigint;
//# sourceMappingURL=toBigInt.d.ts.map