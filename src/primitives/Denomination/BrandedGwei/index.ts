// Export type definition
export type { BrandedGwei } from "./BrandedGwei.js";

// Export constants
export { WEI_PER_GWEI, GWEI_PER_ETHER } from "./constants.js";

// Import all functions
import { from } from "./from.js";
import { fromEther } from "./fromEther.js";
import { fromWei } from "./fromWei.js";
import { toEther } from "./toEther.js";
import { toU256 } from "./toU256.js";
import { toWei } from "./toWei.js";

// Export individual functions (public API)
export { from, fromEther, fromWei, toEther, toWei, toU256 };

// Export internal functions (tree-shakeable)
export {
	from as _from,
	fromEther as _fromEther,
	fromWei as _fromWei,
	toEther as _toEther,
	toWei as _toWei,
	toU256 as _toU256,
};

// Export as namespace (convenience)
export const Gwei = {
	from,
	fromEther,
	fromWei,
	toEther,
	toWei,
	toU256,
};
