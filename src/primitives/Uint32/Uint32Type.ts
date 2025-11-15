import type { brand } from "../../brand.js";

/**
 * Uint32 type
 *
 * 32-bit unsigned integer (0 to 4294967295).
 * Used for block numbers, gas limits, timestamps (until year 2106).
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 */
export type Uint32Type = number & { readonly [brand]: "Uint32" };
