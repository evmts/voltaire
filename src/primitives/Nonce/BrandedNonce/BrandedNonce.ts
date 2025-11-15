import type { brand } from "../../../brand.js";
import type { Uint256Type } from "../../Uint/Uint256Type.js";

/**
 * Branded Nonce type - prevents nonce reuse/confusion
 * Variable-length Uint8Array representing a transaction nonce
 */
export type BrandedNonce = Uint256Type & { readonly [brand]: "Nonce" };
