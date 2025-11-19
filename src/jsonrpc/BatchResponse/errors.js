/**
 * Get all error responses from batch
 *
 * @param {Array} batch - Batch response
 * @returns {Array} Array of error responses
 *
 * @example
 * ```typescript
 * const batch = BatchResponse.from([
 *   { id: 1, result: "0x123" },
 *   { id: 2, error: { code: -32601, message: "Method not found" } },
 *   { id: 3, error: { code: -32602, message: "Invalid params" } }
 * ]);
 * const errs = BatchResponse.errors(batch);
 * // [
 * //   { id: 2, error: { code: -32601, message: "Method not found" } },
 * //   { id: 3, error: { code: -32602, message: "Invalid params" } }
 * // ]
 * ```
 */
export function errors(batch) {
	return batch.filter((res) => "error" in res);
}
