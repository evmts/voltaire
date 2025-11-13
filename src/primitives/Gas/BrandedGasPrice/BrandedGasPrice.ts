import type { brand } from "../../../brand.js";
import type { BrandedUint256 } from "../../Uint/BrandedUint256/BrandedUint256.js";

/**
 * Branded GasPrice type - prevents gas parameter confusion
 * Variable-length Uint8Array representing gas price in wei per gas unit
 */
export type BrandedGasPrice = BrandedUint256 & { readonly [brand]: "GasPrice" };
