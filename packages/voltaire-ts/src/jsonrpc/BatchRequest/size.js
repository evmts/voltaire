/**
 * Get size of batch request
 *
 * @param {Array<*>} batch - Batch request
 * @returns {number} Number of requests in batch
 *
 * @example
 * ```typescript
 * const batch = BatchRequest.from([
 *   { id: 1, method: "eth_blockNumber" },
 *   { id: 2, method: "eth_gasPrice" }
 * ]);
 * BatchRequest.size(batch); // 2
 * ```
 */
export function size(batch) {
	return batch.length;
}
