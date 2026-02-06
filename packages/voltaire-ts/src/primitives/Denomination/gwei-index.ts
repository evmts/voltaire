// Export type definition
export type { BrandedGwei, GweiType } from "./GweiType.js";

// Export constants
export { GWEI_PER_ETHER, WEI_PER_GWEI } from "./gwei-constants.js";

// Import all functions
import { from } from "./gwei-from.js";
import { fromEther } from "./gwei-fromEther.js";
import { fromWei } from "./gwei-fromWei.js";
import { toEther } from "./gwei-toEther.js";
import { toU256 } from "./gwei-toU256.js";
import { toWei } from "./gwei-toWei.js";

// Export individually (tree-shakeable)
export { from, fromWei, fromEther, toWei, toEther, toU256 };

// Export as namespace (convenience)
export const Gwei = {
	from,
	fromWei,
	fromEther,
	toWei,
	toEther,
	toU256,
};
