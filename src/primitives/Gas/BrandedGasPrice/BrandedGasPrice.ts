import type { brand } from "../../../brand.js";
import type { BrandedUint } from "../../Uint/BrandedUint/BrandedUint.js";

/**
 * Branded GasPrice type - prevents gas parameter confusion
 * Variable-length Uint8Array representing gas price in wei per gas unit
 */
export type BrandedGasPrice = BrandedUint & { readonly [brand]: "GasPrice" };
