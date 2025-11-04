// @ts-nocheck
export * from "@tevm/chains";

import { from } from "./from.js";
import { fromId } from "./fromId.js";
import { byId } from "./byId.js";

// Export individual functions
export { from, fromId, byId };

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
	return from(chain);
}

Chain.from = function (chain) {
	return from(chain);
};
Chain.from.prototype = Chain.prototype;

Chain.fromId = function (id) {
	return fromId(id);
};
Chain.fromId.prototype = Chain.prototype;

Chain.byId = byId;
