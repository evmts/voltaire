// @ts-nocheck
import { HEX_BYTE_TABLE } from "../Hex/hexLookup.js";

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
				hex += HEX_BYTE_TABLE[tx[i]];
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
				hex += HEX_BYTE_TABLE[hash[i]];
			}
			return hex;
		});
	}

	return params;
}
