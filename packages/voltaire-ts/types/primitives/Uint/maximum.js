/**
 * Get maximum of two values
 *
 * @param uint - First value
 * @param b - Second value
 * @returns max(uint, b)
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(200n);
 * const max1 = Uint.maximum(a, b); // 200
 * const max2 = a.maximum(b); // 200
 * ```
 */
export function maximum(uint, b) {
    return uint > b ? uint : b;
}
