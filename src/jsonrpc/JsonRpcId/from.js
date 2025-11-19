/**
 * Create JsonRpcId from string, number, or null
 *
 * @param {string | number | null} value - ID value
 * @returns {string | number | null} JSON-RPC ID
 * @throws {TypeError} If value is not string, number, or null
 *
 * @example
 * ```typescript
 * import { JsonRpcId } from './jsonrpc/JsonRpcId/index.js';
 * const id1 = JsonRpcId.from(1);
 * const id2 = JsonRpcId.from("request-123");
 * const id3 = JsonRpcId.from(null);
 * ```
 */
export function from(value) {
	if (
		typeof value !== "string" &&
		typeof value !== "number" &&
		value !== null
	) {
		throw new TypeError(
			`JSON-RPC ID must be string, number, or null. Got ${typeof value}`,
		);
	}
	return value;
}
