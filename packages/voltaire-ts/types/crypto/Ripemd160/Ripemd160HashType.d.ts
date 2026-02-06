import type { brand } from "../../brand.js";
/**
 * Ripemd160Hash - 20-byte branded Uint8Array type
 *
 * Type-safe wrapper around Uint8Array representing a RIPEMD160 hash.
 * Zero runtime overhead - just compile-time type checking.
 *
 * @since 0.0.0
 * @example
 * ```typescript
 * import type { Ripemd160Hash } from './crypto/Ripemd160/index.js';
 *
 * const hash: Ripemd160Hash = Ripemd160Hash.from("hello");
 * // Uint8Array(20) with type branding
 * ```
 */
export type Ripemd160Hash = Uint8Array & {
    readonly [brand]: "Ripemd160Hash";
};
export declare const SIZE = 20;
//# sourceMappingURL=Ripemd160HashType.d.ts.map