/**
 * Check less than or equal
 *
 * @param uint - First value
 * @param b - Second value
 * @returns true if uint <= b
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(100n);
 * const isLte1 = Uint.lessThanOrEqual(a, b); // true
 * const isLte2 = a.lessThanOrEqual(b); // true
 * ```
 */
export function lessThanOrEqual(uint, b) {
    return uint <= b;
}
