// Export type definition
export type { BrandedEther, EtherType } from "./EtherType.js";

// Export constants
export { GWEI_PER_ETHER, WEI_PER_ETHER } from "./ether-constants.js";

// Import all functions
import { from } from "./ether-from.js";
import { fromGwei } from "./ether-fromGwei.js";
import { fromWei } from "./ether-fromWei.js";
import { toGwei } from "./ether-toGwei.js";
import { toU256 } from "./ether-toU256.js";
import { toWei } from "./ether-toWei.js";

// Export individually (tree-shakeable)
export { from, fromWei, fromGwei, toWei, toGwei, toU256 };

// Export as namespace (convenience)
export const Ether = {
	from,
	fromWei,
	fromGwei,
	toWei,
	toGwei,
	toU256,
};
