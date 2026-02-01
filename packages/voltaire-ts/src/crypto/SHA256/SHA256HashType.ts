import type { brand } from "../../brand.js";

/**
 * SHA256Hash - 32-byte branded Uint8Array type
 *
 * Type-safe wrapper around Uint8Array representing a SHA256 hash.
 * Zero runtime overhead - just compile-time type checking.
 *
 * @since 0.0.0
 * @example
 * ```typescript
 * import type { SHA256Hash } from './crypto/SHA256/index.js';
 *
 * const hash: SHA256Hash = SHA256Hash.from("hello");
 * // Uint8Array(32) with type branding
 * ```
 */
export type SHA256Hash = Uint8Array & {
	readonly [brand]: "SHA256Hash";
};

export const SIZE = 32;
