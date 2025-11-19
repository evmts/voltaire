/**
 * Create JsonRpcError from error object or components
 *
 * @param {object | number} codeOrError - Error code or full error object
 * @param {string} [message] - Error message (required if first arg is code)
 * @param {unknown} [data] - Optional additional error data
 * @returns {object} JSON-RPC error object
 * @throws {TypeError} If parameters are invalid
 *
 * @example
 * ```typescript
 * import { JsonRpcError } from './jsonrpc/JsonRpcError/index.js';
 *
 * // From code and message
 * const err1 = JsonRpcError.from(-32601, "Method not found");
 *
 * // With data
 * const err2 = JsonRpcError.from(-32602, "Invalid params", { expected: "number" });
 *
 * // From error object
 * const err3 = JsonRpcError.from({
 *   code: -32700,
 *   message: "Parse error"
 * });
 * ```
 */
export function from(codeOrError, message, data) {
	// If first arg is object, treat as full error
	if (typeof codeOrError === "object" && codeOrError !== null) {
		const error = codeOrError;
		if (typeof error.code !== "number") {
			throw new TypeError("Error code must be a number");
		}
		if (typeof error.message !== "string") {
			throw new TypeError("Error message must be a string");
		}
		return {
			code: error.code,
			message: error.message,
			...(error.data !== undefined && { data: error.data }),
		};
	}

	// Otherwise construct from code and message
	if (typeof codeOrError !== "number") {
		throw new TypeError("Error code must be a number");
	}
	if (typeof message !== "string") {
		throw new TypeError("Error message must be a string");
	}

	const result = {
		code: codeOrError,
		message,
	};

	if (data !== undefined) {
		result.data = data;
	}

	return result;
}
