import { CHAIN_METADATA } from "./metadata.js";

/**
 * Get WebSocket URL(s) for the chain
 *
 * @param {import('./ChainType.js').Chain} chain - Chain object
 * @returns {string | string[] | undefined} WebSocket URL(s) or undefined if none
 *
 * @example
 * ```typescript
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
