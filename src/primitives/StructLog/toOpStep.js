/**
 * Converts a StructLog to an OpStep
 * Parses hex strings back to typed values
 *
 * @param {import('./StructLogType.js').StructLogType} log - StructLog to convert
 * @returns {import('../OpStep/OpStepType.js').OpStepType} OpStep instance
 * @example
 * ```javascript
 * import { toOpStep } from './toOpStep.js';
 * const step = toOpStep(structLog);
 * ```
 */
export function toOpStep(log) {
	// Parse opcode name to opcode number
	// This is a simplified mapping - real implementation would need full opcode table
	/** @type {Record<string, number>} */
	const opcodeMap = {
		STOP: 0x00,
		ADD: 0x01,
		MUL: 0x02,
		SUB: 0x03,
		DIV: 0x04,
		PUSH1: 0x60,
		PUSH2: 0x61,
		PUSH32: 0x7f,
		SSTORE: 0x55,
		SLOAD: 0x54,
		// Add more as needed
	};

	const op = opcodeMap[log.op] ?? 0x00;

	// Parse stack from hex strings
	const stack = log.stack?.map((hex) => BigInt(hex)) ?? [];

	// Parse memory if present
	let memory;
	if (log.memory) {
		const chunks = log.memory.map((hex) => {
			const bytes = new Uint8Array(
				hex.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
			);
			return bytes;
		});
		// Concatenate all chunks
		const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
		memory = new Uint8Array(totalLength);
		let offset = 0;
		for (const chunk of chunks) {
			memory.set(chunk, offset);
			offset += chunk.length;
		}
	}

	// Parse storage if present
	/** @type {Record<string, bigint> | undefined} */
	let storage;
	if (log.storage) {
		/** @type {Record<string, bigint>} */
		const storageObj = {};
		for (const [key, value] of Object.entries(log.storage)) {
			storageObj[key] = BigInt(value);
		}
		storage = storageObj;
	}

	return /** @type {import('../OpStep/OpStepType.js').OpStepType} */ ({
		pc: log.pc,
		op,
		gas: log.gas,
		gasCost: log.gasCost,
		depth: log.depth,
		...(stack.length > 0 && { stack }),
		...(memory !== undefined && { memory }),
		...(storage !== undefined && { storage }),
		...(log.error !== undefined && { error: log.error }),
	});
}
