/**
 * Check if a JSON-RPC request is a notification (no id field)
 *
 * @param {object} request - JSON-RPC request to check
 * @returns {boolean} True if request is a notification
 *
 * @example
 * ```javascript
 * import { isNotification } from './jsonrpc/JsonRpcRequest/isNotification.js';
 *
 * const notif = { jsonrpc: "2.0", method: "eth_subscription", params: [...] };
 * isNotification(notif); // true
 *
 * const req = { jsonrpc: "2.0", id: 1, method: "eth_blockNumber" };
 * isNotification(req); // false
 * ```
 */
export function isNotification(request) {
	return !("id" in request);
}
