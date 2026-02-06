/**
 * Create Gwei from bigint, number, or string
 *
 * Gwei is a string type to support decimal values like "1.5" or "0.001"
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param value - Value to convert (bigint, number, or string)
 * @returns Gwei amount as branded string
 * @throws {Error} If value is not a valid number
 * @example
 * ```typescript
 * const gwei1 = Gwei.from(1n);        // "1"
 * const gwei2 = Gwei.from(1.5);       // "1.5"
 * const gwei3 = Gwei.from("1.5");     // "1.5"
 * const gwei4 = Gwei.from("0.001");   // "0.001"
 * ```
 */
export function from(value) {
    if (typeof value === "bigint") {
        if (value < 0n) {
            throw new Error(`Gwei value cannot be negative: ${value}`);
        }
        return value.toString();
    }
    if (typeof value === "number") {
        if (!Number.isFinite(value)) {
            throw new Error(`Invalid Gwei value: ${value}`);
        }
        if (value < 0) {
            throw new Error(`Gwei value cannot be negative: ${value}`);
        }
        return value.toString();
    }
    // string - validate it's a valid number
    const trimmed = value.trim();
    if (trimmed === "" || Number.isNaN(Number(trimmed))) {
        throw new Error(`Invalid Gwei value: ${value}`);
    }
    const numValue = Number(trimmed);
    if (numValue < 0) {
        throw new Error(`Gwei value cannot be negative: ${trimmed}`);
    }
    return trimmed;
}
