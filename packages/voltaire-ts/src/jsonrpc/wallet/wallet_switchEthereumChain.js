/**
 * @param {string} chainId - Hex-encoded chain ID (e.g., "0x1" for mainnet)
 * @returns {{ method: string, params: [{ chainId: string }] }}
 */
export function WalletSwitchEthereumChainRequest(chainId) {
	return {
		method: "wallet_switchEthereumChain",
		params: [{ chainId }],
	};
}
