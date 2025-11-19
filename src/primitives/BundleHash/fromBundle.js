// @ts-nocheck

/**
 * @typedef {import('./BundleHashType.js').BundleHashType} BundleHashType
 * @typedef {import('../Bundle/BundleType.js').BundleType} BundleType
 */

/**
 * Computes BundleHash from a Bundle
 *
 * @param {BundleType} bundle - Bundle instance
 * @param {object} crypto - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} crypto.keccak256 - Keccak256 function
 * @returns {BundleHashType} Bundle hash
 * @example
 * ```typescript
 * import * as BundleHash from './BundleHash/index.js';
 * import { keccak256 } from './crypto/keccak256.js';
 * const hash = BundleHash.fromBundle(bundle, { keccak256 });
 * ```
 */
export function fromBundle(bundle, crypto) {
	if (!crypto?.keccak256) {
		throw new Error("keccak256 not provided");
	}

	// Concatenate all transaction hashes
	const data = new Uint8Array(bundle.transactions.length * 32);
	let offset = 0;
	for (const tx of bundle.transactions) {
		const txHash = crypto.keccak256(tx);
		data.set(txHash, offset);
		offset += 32;
	}

	// Hash the concatenated hashes to get bundle hash
	return crypto.keccak256(data);
}
