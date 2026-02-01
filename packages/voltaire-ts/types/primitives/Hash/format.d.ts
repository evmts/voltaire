/**
 * Format hash for display (truncated)
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {import('./HashType.js').HashType} hash - Hash to format
 * @param {number} [prefixLength=6] - Number of chars to show at start
 * @param {number} [suffixLength=4] - Number of chars to show at end
 * @returns {string} Formatted string like "0x1234...5678"
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const hash = Hash.from('0x1234...');
 * const display = Hash.format(hash); // "0x1234...5678"
 * ```
 */
export function format(hash: import("./HashType.js").HashType, prefixLength?: number, suffixLength?: number): string;
//# sourceMappingURL=format.d.ts.map