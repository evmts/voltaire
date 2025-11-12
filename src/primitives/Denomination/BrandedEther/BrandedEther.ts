import type { brand } from "../../../brand.js";
import type { BrandedUint } from "../../Uint/BrandedUint/BrandedUint.js";

/**
 * Branded Ether type - represents Ethereum amounts in ether (10^18 wei)
 */
export type BrandedEther = BrandedUint & { readonly [brand]: "Ether" };
