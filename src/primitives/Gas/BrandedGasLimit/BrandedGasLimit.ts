import type { brand } from "../../../brand.js";
import type { BrandedUint } from "../../Uint/BrandedUint/BrandedUint.js";

/**
 * Branded GasLimit type - prevents gas parameter confusion
 * Variable-length Uint8Array representing maximum gas units for a transaction
 */
export type BrandedGasLimit = BrandedUint & { readonly [brand]: "GasLimit" };
