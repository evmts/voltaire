/**
 * Check if value is Item
 *
 * Note: Type guards don't use this: pattern as they operate on unknown values
 *
 * @see https://voltaire.tevm.sh/primitives/authorization
 * @since 0.0.0
 * @param {unknown} value - Value to check
 * @returns {boolean} True if value is Item
 * @throws {never}
 * @example
 * ```javascript
 * import * as Authorization from './primitives/Authorization/index.js';
 * const value = { chainId: 1n, address: '0x742d35Cc...', nonce: 0n, yParity: 0, r: 0n, s: 0n };
 * if (Authorization.isItem(value)) {
 *   // value is Item
 * }
 * ```
 */
export function isItem(value: unknown): boolean;
//# sourceMappingURL=isItem.d.ts.map