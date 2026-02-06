import type { EtherType as BrandedEther } from "./EtherType.js";
/**
 * Create Ether from bigint, number, or string
 *
 * Ether is a string type to support decimal values like "1.5" or "0.001"
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param value - Value to convert (bigint, number, or string)
 * @returns Ether amount as branded string
 * @throws {Error} If value is not a valid number
 * @example
 * ```typescript
 * const ether1 = Ether.from(1n);        // "1"
 * const ether2 = Ether.from(1.5);       // "1.5"
 * const ether3 = Ether.from("1.5");     // "1.5"
 * const ether4 = Ether.from("0.001");   // "0.001"
 * ```
 */
export declare function from(value: bigint | number | string): BrandedEther;
//# sourceMappingURL=ether-from.d.ts.map