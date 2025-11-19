/**
 * Create BatchResponse from array of responses
 *
 * @param {Array} responses - Array of JSON-RPC response objects
 * @returns {Array} Batch response (readonly array)
 * @throws {TypeError} If not an array
 *
 * @example
 * ```typescript
 * import { BatchResponse } from './jsonrpc/BatchResponse/index.js';
 *
 * const batch = BatchResponse.from([
 *   { id: 1, result: "0x123456" },
 *   { id: 2, result: "0x3b9aca00" },
 *   { id: 3, error: { code: -32601, message: "Method not found" } }
 * ]);
 * ```
 */
export function from(responses) {
	if (!Array.isArray(responses)) {
		throw new TypeError("Batch response must be an array");
	}

	// Note: Empty array is valid (all notifications or filtered responses)

	// Validate each response has required fields
	for (let i = 0; i < responses.length; i++) {
		const res = responses[i];
		if (!res || typeof res !== "object") {
			throw new TypeError(`Response at index ${i} must be an object`);
		}
		const hasResult = "result" in res;
		const hasError = "error" in res;
		if (!hasResult && !hasError) {
			throw new TypeError(
				`Response at index ${i} must have either result or error`,
			);
		}
	}

	// Return as readonly array
	return Object.freeze([...responses]);
}
