/**
 * Get all success responses from batch
 *
 * @param {Array} batch - Batch response
 * @returns {Array} Array of success responses
 *
 * @example
 * ```typescript
 * const batch = BatchResponse.from([
 *   { id: 1, result: "0x123" },
 *   { id: 2, error: { code: -32601, message: "Method not found" } },
 *   { id: 3, result: "0x456" }
 * ]);
 * const results = BatchResponse.results(batch);
 * // [
 * //   { id: 1, result: "0x123" },
 * //   { id: 3, result: "0x456" }
 * // ]
 * ```
 */
export function results(batch) {
	return batch.filter((res) => "result" in res);
}
