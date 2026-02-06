/**
 * @typedef {Object} ChainInfo
 * @property {string} chainId - Hex-encoded chain ID
 * @property {string} chainName - Human-readable chain name
 * @property {{ name: string, symbol: string, decimals: number }} nativeCurrency - Native currency info
 * @property {string[]} rpcUrls - RPC endpoint URLs
 * @property {string[]} [blockExplorerUrls] - Block explorer URLs
 * @property {string[]} [iconUrls] - Chain icon URLs
 */

/**
 * @param {ChainInfo} chain
 * @returns {{ method: string, params: [ChainInfo] }}
 */
export function WalletAddEthereumChainRequest(chain) {
	return {
		method: "wallet_addEthereumChain",
		params: [chain],
	};
}
