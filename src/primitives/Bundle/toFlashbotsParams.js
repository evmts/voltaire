// @ts-nocheck

/**
 * @typedef {import('./BundleType.js').BundleType} BundleType
 */

/**
 * Converts bundle to Flashbots RPC parameters
 *
 * @param {BundleType} bundle - Bundle instance
 * @returns {object} Flashbots eth_sendBundle parameters
 * @example
 * ```typescript
 * import * as Bundle from './Bundle/index.js';
 * const params = Bundle.toFlashbotsParams(bundle);
 * await flashbots.request({ method: "eth_sendBundle", params: [params] });
 * ```
 */
export function toFlashbotsParams(bundle) {
	const params = {
		txs: bundle.transactions.map((tx) => {
			// Convert to hex string
			let hex = "0x";
			for (let i = 0; i < tx.length; i++) {
				hex += tx[i].toString(16).padStart(2, "0");
			}
			return hex;
		}),
	};

	if (bundle.blockNumber !== undefined) {
		params.blockNumber = `0x${bundle.blockNumber.toString(16)}`;
	}

	if (bundle.minTimestamp !== undefined) {
		params.minTimestamp = Number(bundle.minTimestamp);
	}

	if (bundle.maxTimestamp !== undefined) {
		params.maxTimestamp = Number(bundle.maxTimestamp);
	}

	if (bundle.revertingTxHashes !== undefined) {
		params.revertingTxHashes = bundle.revertingTxHashes.map((hash) => {
			let hex = "0x";
			for (let i = 0; i < hash.length; i++) {
				hex += hash[i].toString(16).padStart(2, "0");
			}
			return hex;
		});
	}

	return params;
}
