/**
 * Create BatchRequest from array of requests
 *
 * @param {Array} requests - Array of JSON-RPC request objects
 * @returns {Array} Batch request (readonly array)
 * @throws {TypeError} If not an array or empty
 *
 * @example
 * ```typescript
 * import { BatchRequest } from './jsonrpc/BatchRequest/index.js';
 *
 * const batch = BatchRequest.from([
 *   { id: 1, method: "eth_blockNumber" },
 *   { id: 2, method: "eth_gasPrice" },
 *   { id: 3, method: "eth_chainId" }
 * ]);
 * ```
 */
export function from(requests) {
	if (!Array.isArray(requests)) {
		throw new TypeError("Batch request must be an array");
	}

	if (requests.length === 0) {
		throw new TypeError("Batch request cannot be empty");
	}

	// Validate each request has required fields
	for (let i = 0; i < requests.length; i++) {
		const req = requests[i];
		if (!req || typeof req !== "object") {
			throw new TypeError(`Request at index ${i} must be an object`);
		}
		if (typeof req.method !== "string") {
			throw new TypeError(`Request at index ${i} missing method`);
		}
	}

	// Return as readonly array
	return Object.freeze([...requests]);
}
