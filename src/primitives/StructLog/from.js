/**
 * Creates a StructLog from raw data
 *
 * @param {object} data - StructLog data
 * @param {number} data.pc - Program counter
 * @param {string} data.op - Opcode name
 * @param {import('../Uint/Uint256Type.js').Uint256Type} data.gas - Remaining gas
 * @param {import('../Uint/Uint256Type.js').Uint256Type} data.gasCost - Gas cost
 * @param {number} data.depth - Call depth
 * @param {readonly string[]} data.stack - Stack as hex strings
 * @param {readonly string[]} [data.memory] - Memory as hex chunks
 * @param {Record<string, string>} [data.storage] - Storage changes
 * @param {import('../Uint/Uint256Type.js').Uint256Type} [data.refund] - Gas refund
 * @param {string} [data.error] - Error message
 * @returns {import('./StructLogType.js').StructLogType} StructLog instance
 * @example
 * ```javascript
 * import { from } from './from.js';
 * const log = from({
 *   pc: 0,
 *   op: "PUSH1",
 *   gas: 1000000n,
 *   gasCost: 3n,
 *   depth: 0,
 *   stack: ["0x60"]
 * });
 * ```
 */
export function from(data) {
	return {
		pc: data.pc,
		op: data.op,
		gas: data.gas,
		gasCost: data.gasCost,
		depth: data.depth,
		stack: data.stack,
		...(data.memory !== undefined && { memory: data.memory }),
		...(data.storage !== undefined && { storage: data.storage }),
		...(data.refund !== undefined && { refund: data.refund }),
		...(data.error !== undefined && { error: data.error }),
	};
}
