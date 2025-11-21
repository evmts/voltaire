import * as Selector from "../../../Selector/index.js";

/**
 * ERC-7751 WrappedError selector
 *
 * Selector for: error WrappedError(address target, bytes4 selector, bytes reason, bytes details)
 *
 * @type {import('../../../Selector/SelectorType.js').SelectorType}
 * @see https://eips.ethereum.org/EIPS/eip-7751
 */
export const WRAPPED_ERROR_SELECTOR = Selector.fromSignature(
	"WrappedError(address,bytes4,bytes,bytes)",
);
