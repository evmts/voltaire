/**
 * Check if two MultiTokenId values are equal
 *
 * @see https://voltaire.tevm.sh/primitives/multi-token-id for MultiTokenId documentation
 * @since 0.0.0
 * @param {import('./MultiTokenIdType.js').MultiTokenIdType} a - First MultiTokenId
 * @param {import('./MultiTokenIdType.js').MultiTokenIdType} b - Second MultiTokenId
 * @returns {boolean} true if equal
 * @example
 * ```javascript
 * import * as MultiTokenId from './primitives/MultiTokenId/index.js';
 * const a = MultiTokenId.from(1n);
 * const b = MultiTokenId.from(1n);
 * const result = MultiTokenId.equals(a, b); // true
 * ```
 */
export function equals(a: import("./MultiTokenIdType.js").MultiTokenIdType, b: import("./MultiTokenIdType.js").MultiTokenIdType): boolean;
//# sourceMappingURL=equals.d.ts.map