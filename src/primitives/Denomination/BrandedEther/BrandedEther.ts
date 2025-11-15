import type { brand } from "../../../brand.js";
import type { Uint256Type } from "../../Uint/Uint256Type.js";

/**
 * Branded Ether type - represents Ethereum amounts in ether (10^18 wei)
 */
export type BrandedEther = Uint256Type & { readonly [brand]: "Ether" };
