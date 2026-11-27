import { HEX_BYTE_TABLE } from "../Hex/hexLookup.js";

/**
 * @typedef {import('./BundleType.js').BundleType} BundleType
 */

/**
 * Convert bytes to 0x-prefixed hex string
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function bytesToHex(bytes) {
	let hex = "0x";
	for (let i = 0; i < bytes.length; i++) {
		hex += HEX_BYTE_TABLE[/** @type {number} */ (bytes[i])];
	}
	return hex;
}

/**
 * Converts bundle to Flashbots RPC parameters
 *
 * @param {BundleType} bundle - Bundle instance
 * @returns {{ txs: string[], blockNumber?: string, minTimestamp?: number, maxTimestamp?: number, revertingTxHashes?: string[] }} Flashbots eth_sendBundle parameters
 * @example
 * ```typescript
 * import * as Bundle from './Bundle/index.js';
 * const params = Bundle.toFlashbotsParams(bundle);
 * await flashbots.request({ method: "eth_sendBundle", params: [params] });
 * ```
 */
export function toFlashbotsParams(bundle) {
	/** @type {{ txs: string[], blockNumber?: string, minTimestamp?: number, maxTimestamp?: number, revertingTxHashes?: string[] }} */
	const params = {
		txs: bundle.transactions.map(bytesToHex),
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
		params.revertingTxHashes = bundle.revertingTxHashes.map(bytesToHex);
	}

	return params;
}
