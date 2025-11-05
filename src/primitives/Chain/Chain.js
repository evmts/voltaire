// @ts-nocheck
import * as BrandedChain from "./BrandedChain/index.js";

/**
 * @typedef {import('./ChainType.js').Chain} Chain
 * @typedef {import('./ChainConstructor.js').ChainConstructor} ChainConstructor
 */

/**
 * Factory function for creating Chain instances
 *
 * @type {ChainConstructor}
 */
export function Chain(chain) {
	const result = BrandedChain.from(chain);
	Object.setPrototypeOf(result, Chain.prototype);
	return result;
}

// Static constructors
Chain.from = (chain) => {
	const result = BrandedChain.from(chain);
	Object.setPrototypeOf(result, Chain.prototype);
	return result;
};
Chain.from.prototype = Chain.prototype;

Chain.fromId = (id) => {
	const result = BrandedChain.fromId(id);
	if (result) Object.setPrototypeOf(result, Chain.prototype);
	return result;
};
Chain.fromId.prototype = Chain.prototype;

// Static utility property (doesn't return Chain instances)
Chain.byId = BrandedChain.byId;
