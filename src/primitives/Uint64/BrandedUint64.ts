import type { brand } from "../../brand.js";

/**
 * Branded Uint64 type
 *
 * 64-bit unsigned integer (0 to 18446744073709551615).
 * Uses bigint to handle values beyond Number.MAX_SAFE_INTEGER.
 * Used for timestamps, large counters, nonces.
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 */
export type BrandedUint64 = bigint & { readonly [brand]: "Uint64" };
