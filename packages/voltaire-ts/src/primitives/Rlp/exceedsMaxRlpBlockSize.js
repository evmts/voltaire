import { MAX_RLP_BLOCK_SIZE } from "./constants.js";

/**
 * Check whether an RLP-encoded execution block exceeds the EIP-7934 byte limit.
 *
 * @param {Uint8Array} encodedRlp - The RLP-encoded execution block.
 * @returns {boolean} Whether the encoded size exceeds 8 MiB.
 */
export function exceedsMaxRlpBlockSize(encodedRlp) {
	return encodedRlp.length > MAX_RLP_BLOCK_SIZE;
}
