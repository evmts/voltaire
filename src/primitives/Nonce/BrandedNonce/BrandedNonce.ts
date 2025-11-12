import type { brand } from "../../../brand.js";
import type { BrandedUint } from "../../Uint/BrandedUint/BrandedUint.js";

/**
 * Branded Nonce type - prevents nonce reuse/confusion
 * Variable-length Uint8Array representing a transaction nonce
 */
export type BrandedNonce = BrandedUint & { readonly [brand]: "Nonce" };
