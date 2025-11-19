/**
 * Create new request with updated params
 *
 * @param {object} request - Original request
 * @returns {function} Function that takes new params and returns updated request
 *
 * @example
 * ```typescript
 * const req = JsonRpcRequest.from({ id: 1, method: "eth_call" });
 * const withParams = JsonRpcRequest.withParams(req);
 * const updated = withParams({ to: "0x123...", data: "0xabc..." });
 * ```
 */
export function withParams(request) {
	return function (params) {
		return {
			...request,
			params,
		};
	};
}
