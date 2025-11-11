import { CHAIN_METADATA } from "./metadata.js";

/**
 * Get WebSocket URL(s) for the chain
 *
 * @see https://voltaire.tevm.sh/primitives/chain for Chain documentation
 * @since 0.0.0
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {string | string[] | undefined} WebSocket URL(s) or undefined if none
 * @throws {never}
 * @example
 * ```javascript
 * import * as Chain from './primitives/Chain/index.js';
 * const ws = Chain.getWebsocketUrl(mainnet);
 * // => ["wss://...", "wss://..."]
 * ```
 */
export function getWebsocketUrl(chain) {
	const metadata = CHAIN_METADATA[chain.chainId];
	if (!metadata?.websocketUrls) {
		return undefined;
	}
	return metadata.websocketUrls.length === 1
		? metadata.websocketUrls[0]
		: metadata.websocketUrls;
}
