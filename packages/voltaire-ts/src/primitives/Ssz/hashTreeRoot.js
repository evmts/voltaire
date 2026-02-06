/**
 * @description Computes the hash tree root of data for Merkle proofs
 * @param {Uint8Array} data - Data to merkleize
 * @returns {Promise<Uint8Array>} 32-byte hash tree root
 */
export async function hashTreeRoot(data) {
	const CHUNK_SIZE = 32;
	const ZERO_HASH = new Uint8Array(32);

	// Chunk data into 32-byte leaves
	const chunkCount = Math.ceil(data.length / CHUNK_SIZE);
	const chunks = [];

	for (let i = 0; i < chunkCount; i++) {
		const chunk = new Uint8Array(CHUNK_SIZE);
		const start = i * CHUNK_SIZE;
		const end = Math.min(start + CHUNK_SIZE, data.length);
		chunk.set(data.slice(start, end));
		chunks.push(chunk);
	}

	if (chunks.length === 0) {
		return ZERO_HASH;
	}

	// Pad to next power of 2
	const targetLen = nextPowerOfTwo(chunks.length);
	while (chunks.length < targetLen) {
		chunks.push(ZERO_HASH);
	}

	// Build Merkle tree bottom-up
	/** @type {Uint8Array[]} */
	let layer = chunks;
	while (layer.length > 1) {
		/** @type {Uint8Array[]} */
		const nextLayer = [];
		for (let i = 0; i < layer.length; i += 2) {
			const hash = await hashPair(
				/** @type {Uint8Array} */ (layer[i]),
				/** @type {Uint8Array} */ (layer[i + 1]),
			);
			nextLayer.push(hash);
		}
		layer = nextLayer;
	}

	return /** @type {Uint8Array} */ (layer[0]);
}

/**
 * @description Hashes two 32-byte chunks together
 * @param {Uint8Array} left - Left chunk
 * @param {Uint8Array} right - Right chunk
 * @returns {Promise<Uint8Array>} SHA256 hash
 */
async function hashPair(left, right) {
	const combined = new Uint8Array(64);
	combined.set(left, 0);
	combined.set(right, 32);

	const hashBuffer = await crypto.subtle.digest("SHA-256", combined);
	return new Uint8Array(hashBuffer);
}

/**
 * @description Computes next power of 2 >= n
 * @param {number} n - Input number
 * @returns {number} Next power of 2
 */
function nextPowerOfTwo(n) {
	if (n === 0) return 1;
	let result = 1;
	while (result < n) {
		result *= 2;
	}
	return result;
}
