/**
 * Check if string is valid hash hex
 *
 * Returns false instead of throwing, useful for validation.
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {unknown} value - Value to check
 * @returns {boolean} True if valid hash hex string
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * Hash.isValidHex('0x1234...'); // true or false
 * ```
 */
export function isValidHex(value: unknown): boolean;
//# sourceMappingURL=isValidHex.d.ts.map