/**
 * @typedef {Object} AssetOptions
 * @property {string} address - Token contract address
 * @property {string} symbol - Token symbol
 * @property {number} decimals - Token decimals
 * @property {string} [image] - Token image URL
 */

/**
 * @typedef {Object} Asset
 * @property {string} type - Asset type (typically "ERC20")
 * @property {AssetOptions} options - Asset details
 */

/**
 * @param {Asset} asset
 * @returns {{ method: string, params: { type: string, options: AssetOptions } }}
 */
export function WalletWatchAssetRequest(asset) {
	return {
		method: "wallet_watchAsset",
		params: {
			type: asset.type,
			options: asset.options,
		},
	};
}
