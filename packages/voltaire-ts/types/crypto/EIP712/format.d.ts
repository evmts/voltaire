/**
 * Format typed data for human-readable display.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./EIP712Type.js').TypedData} typedData - Typed data to format
 * @returns {string} Human-readable multi-line string representation
 * @throws {never}
 * @example
 * ```javascript
 * import * as EIP712 from './crypto/EIP712/index.js';
 * const formatted = EIP712.format(typedData);
 * console.log(formatted);
 * ```
 */
export function format(typedData: import("./EIP712Type.js").TypedData): string;
//# sourceMappingURL=format.d.ts.map