/**
 * Creates a TraceResult from raw data
 *
 * @param {object} data - TraceResult data
 * @param {import('../Uint/Uint256Type.js').Uint256Type} data.gas - Total gas used
 * @param {boolean} data.failed - Whether execution failed
 * @param {Uint8Array} data.returnValue - Return value
 * @param {readonly import('../StructLog/StructLogType.js').StructLogType[]} [data.structLogs] - Opcode trace
 * @param {import('../CallTrace/CallTraceType.js').CallTraceType} [data.callTrace] - Call tree
 * @returns {import('./TraceResultType.js').TraceResultType} TraceResult instance
 * @example
 * ```javascript
 * import { from } from './from.js';
 * const result = from({
 *   gas: 50000n,
 *   failed: false,
 *   returnValue: new Uint8Array(),
 *   structLogs: []
 * });
 * ```
 */
export function from(data) {
	return /** @type {import('./TraceResultType.js').TraceResultType} */ ({
		gas: data.gas,
		failed: data.failed,
		returnValue: data.returnValue,
		...(data.structLogs !== undefined && { structLogs: data.structLogs }),
		...(data.callTrace !== undefined && { callTrace: data.callTrace }),
	});
}
