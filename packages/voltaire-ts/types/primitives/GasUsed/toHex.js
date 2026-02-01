/**
 * Convert GasUsed to hex string
 *
 * @this {import('./GasUsedType.js').GasUsedType}
 * @returns {string} Gas used as hex string (0x prefixed)
 *
 * @example
 * ```typescript
 * const gasUsed = GasUsed.from(51234n);
 * GasUsed.toHex(gasUsed); // "0xc822"
 * ```
 */
export function toHex() {
    return `0x${this.toString(16)}`;
}
