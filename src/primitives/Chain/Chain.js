// @ts-nocheck
import * as BrandedChain from "./BrandedChain/index.js";
import { getBlockTime } from "./getBlockTime.js";
import { getExplorerUrl } from "./getExplorerUrl.js";
import { getGasLimit } from "./getGasLimit.js";
import { getHardforkBlock } from "./getHardforkBlock.js";
import { getL1Chain } from "./getL1Chain.js";
import { getLatestHardfork } from "./getLatestHardfork.js";
import { getName } from "./getName.js";
import { getRpcUrl } from "./getRpcUrl.js";
import { getShortName } from "./getShortName.js";
import { getSymbol } from "./getSymbol.js";
import { getWebsocketUrl } from "./getWebsocketUrl.js";
import { isL2 } from "./isL2.js";
import { isTestnet } from "./isTestnet.js";
import { supportsHardfork } from "./supportsHardfork.js";

/**
 * @typedef {import('./ChainType.js').Chain} Chain
 * @typedef {import('./ChainConstructor.js').ChainConstructor} ChainConstructor
 */

/**
 * Factory function for creating Chain instances
 *
 * @see https://voltaire.tevm.sh/primitives/chain for Chain documentation
 * @since 0.0.0
 * @type {ChainConstructor}
 * @throws {never}
 * @example
 * ```javascript
 * import { mainnet } from '@tevm/chains';
 * import * as Chain from './primitives/Chain/index.js';
 * const chain = Chain.Chain(mainnet);
 * ```
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

Chain.fromId = (id) => {
	const result = BrandedChain.fromId(id);
	if (result) Object.setPrototypeOf(result, Chain.prototype);
	return result;
};

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

// Export metadata constants
export { CHAIN_METADATA, DEFAULT_METADATA } from "./metadata.js";
