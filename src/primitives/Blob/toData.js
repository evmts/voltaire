import { SIZE } from "./constants.js";

/**
 * Extract data from blob using length-prefix decoding.
 * Format: 8-byte little-endian length prefix + data + zero padding
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @param {import('../BrandedBlob.js').BrandedBlob} blob - Blob data
 * @returns {Uint8Array} Original data
 * @throws {Error} If blob size is invalid or length prefix is corrupted
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

	// Read 8-byte little-endian length prefix
	const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
	const length = view.getBigUint64(0, true);

	const maxDataSize = SIZE - 8;
	if (length > BigInt(maxDataSize)) {
		throw new Error(
			`Invalid length prefix: ${length} (max ${maxDataSize})`,
		);
	}

	const dataLength = Number(length);
	return blob.slice(8, 8 + dataLength);
}
