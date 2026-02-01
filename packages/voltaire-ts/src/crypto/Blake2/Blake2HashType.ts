import type { brand } from "../../brand.js";

/**
 * Blake2Hash - 64-byte (default) branded Uint8Array type
 *
 * Type-safe wrapper around Uint8Array representing a BLAKE2b hash.
 * Zero runtime overhead - just compile-time type checking.
 * Supports variable output lengths (1-64 bytes).
 *
 * @since 0.0.0
 * @example
 * ```typescript
 * import type { Blake2Hash } from './crypto/Blake2/index.js';
 *
 * const hash: Blake2Hash = Blake2Hash.from("hello");
 * // Uint8Array(64) with type branding
 * ```
 */
export type Blake2Hash = Uint8Array & {
	readonly [brand]: "Blake2Hash";
};

export const SIZE = 64;
