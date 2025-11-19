import { SIZE } from "./constants.js";

/**
 * Extract data from blob
 * Decodes blob format (reads length prefix and extracts data)
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @param {import('../BrandedBlob.js').BrandedBlob} blob - Blob data
 * @returns {Uint8Array} Original data
 * @throws {Error} If blob size or length prefix is invalid
 * @example
 * ```javascript
 * import * as Blob from './primitives/Blob/index.js';
 * const data = Blob.toData(blob);
 * const text = new TextDecoder().decode(data);
 * ```
 */
export function toData(blob) {
	if (blob.length !== SIZE) {
		throw new Error(`Invalid blob size: ${blob.length} (expected ${SIZE})`);
	}

	const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
	const length = Number(view.getBigUint64(0, true));

	if (length > SIZE - 8) {
		throw new Error(`Invalid length prefix: ${length}`);
	}

	return blob.slice(8, 8 + length);
}
