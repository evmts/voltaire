/**
 * Check less than
 *
 * @param uint - First value
 * @param b - Second value
 * @returns true if uint < b
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(200n);
 * const isLess1 = Uint.lessThan(a, b); // true
 * const isLess2 = a.lessThan(b); // true
 * ```
 */
export function lessThan(uint, b) {
    return uint < b;
}
