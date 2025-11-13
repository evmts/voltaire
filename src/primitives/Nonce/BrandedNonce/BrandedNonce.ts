import type { brand } from "../../../brand.js";
import type { BrandedUint256 } from "../../Uint/BrandedUint256/BrandedUint256.js";

/**
 * Branded Nonce type - prevents nonce reuse/confusion
 * Variable-length Uint8Array representing a transaction nonce
 */
export type BrandedNonce = BrandedUint256 & { readonly [brand]: "Nonce" };
