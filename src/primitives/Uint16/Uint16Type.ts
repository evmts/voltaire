import type { brand } from "../../brand.js";

/**
 * Uint16 type
 *
 * A type-safe 16-bit unsigned integer (0-65535) represented as a JavaScript number
 * with compile-time type safety via branding.
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 */
export type Uint16Type = number & { readonly [brand]: "Uint16" };
