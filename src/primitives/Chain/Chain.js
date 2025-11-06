// @ts-nocheck
import * as BrandedChain from "./BrandedChain/index.js";
import { getName } from "./getName.js";
import { getShortName } from "./getShortName.js";
import { getSymbol } from "./getSymbol.js";
import { getRpcUrl } from "./getRpcUrl.js";
import { getExplorerUrl } from "./getExplorerUrl.js";
import { getWebsocketUrl } from "./getWebsocketUrl.js";
import { isTestnet } from "./isTestnet.js";
import { isL2 } from "./isL2.js";
import { getL1Chain } from "./getL1Chain.js";
import { getLatestHardfork } from "./getLatestHardfork.js";
import { getHardforkBlock } from "./getHardforkBlock.js";
import { supportsHardfork } from "./supportsHardfork.js";
import { getBlockTime } from "./getBlockTime.js";
import { getGasLimit } from "./getGasLimit.js";

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

// Basic info
Chain.getName = getName;
Chain.getShortName = getShortName;
Chain.getSymbol = getSymbol;

// Network info
Chain.getRpcUrl = getRpcUrl;
Chain.getExplorerUrl = getExplorerUrl;
Chain.getWebsocketUrl = getWebsocketUrl;

// Classification
Chain.isTestnet = isTestnet;
Chain.isL2 = isL2;
Chain.getL1Chain = getL1Chain;

// Hardfork info
Chain.getLatestHardfork = getLatestHardfork;
Chain.getHardforkBlock = getHardforkBlock;
Chain.supportsHardfork = supportsHardfork;

// Constants
Chain.getBlockTime = getBlockTime;
Chain.getGasLimit = getGasLimit;

// Export metadata types
export { CHAIN_METADATA, DEFAULT_METADATA } from "./metadata.js";
export type { Hardfork, ChainMetadata } from "./metadata.js";
