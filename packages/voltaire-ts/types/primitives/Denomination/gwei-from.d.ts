import type { GweiType as BrandedGwei } from "./GweiType.js";
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
export declare function from(value: bigint | number | string): BrandedGwei;
//# sourceMappingURL=gwei-from.d.ts.map