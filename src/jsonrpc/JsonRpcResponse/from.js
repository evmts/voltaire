/**
 * Create JsonRpcResponse from response object
 *
 * @param {{ id?: string | number | null; result?: unknown; error?: { code: number; message: string; data?: unknown } }} response - Response object with id and either result or error
 * @returns {import('./JsonRpcResponseType.js').JsonRpcResponseType} JSON-RPC response object
 * @throws {TypeError} If required fields are missing or invalid
 *
 * @example
 * ```typescript
 * import { JsonRpcResponse } from './jsonrpc/JsonRpcResponse/index.js';
 *
 * // Success response
 * const res1 = JsonRpcResponse.from({
 *   id: 1,
 *   result: "0x1234567"
 * });
 *
 * // Error response
 * const res2 = JsonRpcResponse.from({
 *   id: 2,
 *   error: {
 *     code: -32601,
 *     message: "Method not found"
 *   }
 * });
 * ```
 */
export function from(response) {
	if (!response || typeof response !== "object") {
		throw new TypeError("Response must be an object");
	}

	const { id, result, error } = response;

	// Validate id
	if (
		typeof id !== "string" &&
		typeof id !== "number" &&
		id !== null &&
		id !== undefined
	) {
		throw new TypeError("Response id must be string, number, or null");
	}

	// Must have either result or error, but not both
	const hasResult = "result" in response;
	const hasError = "error" in response;

	if (!hasResult && !hasError) {
		throw new TypeError("Response must have either result or error");
	}

	if (hasResult && hasError) {
		throw new TypeError("Response cannot have both result and error");
	}

	// Build response
	const base = {
		jsonrpc: "2.0",
		id: id ?? null,
	};

	if (hasResult) {
		return /** @type {import('./JsonRpcResponseType.js').JsonRpcResponseType} */ ({
			...base,
			result,
		});
	}

	// Validate error
	if (!error || typeof error !== "object") {
		throw new TypeError("Response error must be an object");
	}

	if (typeof error.code !== "number") {
		throw new TypeError("Error code must be a number");
	}

	if (typeof error.message !== "string") {
		throw new TypeError("Error message must be a string");
	}

	return /** @type {import('./JsonRpcResponseType.js').JsonRpcResponseType} */ ({
		...base,
		error: {
			code: error.code,
			message: error.message,
			...(error.data !== undefined && { data: error.data }),
		},
	});
}
