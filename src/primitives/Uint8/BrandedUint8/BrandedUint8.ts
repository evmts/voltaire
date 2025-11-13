import type { brand } from "../../../brand.js";

/**
 * Branded Uint8 type
 *
 * A type-safe 8-bit unsigned integer (0-255) represented as a JavaScript number
 * with compile-time type safety via branding.
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 */
export type BrandedUint8 = number & { readonly [brand]: "Uint8" };
