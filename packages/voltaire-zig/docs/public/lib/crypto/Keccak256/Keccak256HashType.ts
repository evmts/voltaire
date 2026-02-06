import type { brand } from "../../brand.js";

/**
 * Keccak256Hash - 32-byte branded Uint8Array type
 *
 * Type-safe wrapper around Uint8Array representing a Keccak256 hash.
 * Zero runtime overhead - just compile-time type checking.
 *
 * @since 0.0.0
 * @example
 * ```ts
 * import type { Keccak256Hash } from './crypto/Keccak256/index.js';
 *
 * const hash: Keccak256Hash = Keccak256Hash.from("hello");
 * // Uint8Array(32) with type branding
 * ```
 */
export type Keccak256Hash = Uint8Array & {
	readonly [brand]: "Keccak256Hash";
};

export const SIZE = 32;
