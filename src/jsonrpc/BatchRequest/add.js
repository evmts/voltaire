/**
 * Add request to batch
 *
 * @param {Array} batch - Existing batch
 * @returns {function} Function that takes a request and returns new batch
 *
 * @example
 * ```typescript
 * let batch = BatchRequest.from([{ id: 1, method: "eth_blockNumber" }]);
 * batch = BatchRequest.add(batch)({ id: 2, method: "eth_gasPrice" });
 * ```
 */
export function add(batch) {
	return function (request) {
		if (!request || typeof request !== "object") {
			throw new TypeError("Request must be an object");
		}
		if (typeof request.method !== "string") {
			throw new TypeError("Request must have method");
		}
		return Object.freeze([...batch, request]);
	};
}
