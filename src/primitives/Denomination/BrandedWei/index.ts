// Export type definition
export type { BrandedWei } from "./BrandedWei.js";

// Export constants
export { WEI_PER_GWEI, WEI_PER_ETHER } from "./constants.js";

// Import all functions
import { from } from "./from.js";
import { fromEther } from "./fromEther.js";
import { fromGwei } from "./fromGwei.js";
import { toEther } from "./toEther.js";
import { toGwei } from "./toGwei.js";
import { toU256 } from "./toU256.js";

// Export individual functions (public API)
export { from, fromEther, fromGwei, toEther, toGwei, toU256 };

// Export internal functions (tree-shakeable)
export {
	from as _from,
	fromEther as _fromEther,
	fromGwei as _fromGwei,
	toEther as _toEther,
	toGwei as _toGwei,
	toU256 as _toU256,
};

// Export as namespace (convenience)
export const BrandedWei = {
	from,
	fromEther,
	fromGwei,
	toEther,
	toGwei,
	toU256,
};
