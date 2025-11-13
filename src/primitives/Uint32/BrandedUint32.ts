import type { brand } from "../../brand.js";

/**
 * Branded Uint32 type
 *
 * 32-bit unsigned integer (0 to 4294967295).
 * Used for block numbers, gas limits, timestamps (until year 2106).
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 */
export type BrandedUint32 = number & { readonly [brand]: "Uint32" };
