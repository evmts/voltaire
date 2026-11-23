/**
 * Expand a decimal string, including scientific notation, to plain decimal
 * notation exactly (no floating-point rounding).
 *
 * `Number#toString` yields scientific notation below `1e-6` and from `1e21`
 * (`(1e-9).toString() === "1e-9"`), which decimal parsers built on
 * `split(".")` + `BigInt` cannot read. This rewrites the digits only.
 *
 * Leading integer zeros and trailing fraction zeros are removed from expanded
 * values. Strings without an exponent are returned trimmed and unchanged.
 *
 * @since 0.0.0
 * @param {string | number} value - Decimal value, e.g. `"1e-9"`, `"1.5E+3"`, `1e21`
 * @returns {string} Plain decimal string, e.g. `"0.000000001"`, `"1500"`
 * @throws {Error} If the exponent magnitude exceeds 1000 or the mantissa has no digits
 * @example
 * ```javascript
 * normalizeDecimal(1e-9); // "0.000000001"
 * normalizeDecimal("1.5e3"); // "1500"
 * normalizeDecimal("2.5"); // "2.5"
 * ```
 */
export function normalizeDecimal(value: string | number): string;
//# sourceMappingURL=normalizeDecimal.d.ts.map