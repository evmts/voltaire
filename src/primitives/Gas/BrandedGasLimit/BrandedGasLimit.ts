import type { brand } from "../../../brand.js";
import type { BrandedUint256 } from "../../Uint/BrandedUint256/BrandedUint256.js";

/**
 * Branded GasLimit type - prevents gas parameter confusion
 * Variable-length Uint8Array representing maximum gas units for a transaction
 */
export type BrandedGasLimit = BrandedUint256 & { readonly [brand]: "GasLimit" };
