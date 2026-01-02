// @ts-nocheck
import { getGasTable } from "./getGasTable.js";
import { getPushSize } from "./getPushSize.js";
import { getStackEffectTable } from "./getStackEffectTable.js";
import { isPush } from "./isPush.js";

/**
 * Scan bytecode as a generator, yielding instruction metadata
 *
 * @param {import('./BytecodeType.js').BrandedBytecode} bytecode - Bytecode to scan
 * @param {import('./BytecodeType.js').ScanOptions} [options] - Scan options
 * @returns {Generator<{
 *   pc: number;
 *   opcode: number;
 *   type: 'push' | 'regular';
 *   size: number;
 *   value?: bigint;
 *   gas?: number;
 *   stackEffect?: { pop: number; push: number };
 * }>} Generator yielding instruction metadata
 *
 * @example
 * ```typescript
 * const code = Bytecode.from("0x6001600201");
 * for (const inst of Bytecode.scan(code)) {
 *   console.log(`PC ${inst.pc}: opcode ${inst.opcode}`);
 * }
 *
 * // With options
 * for (const inst of Bytecode.scan(code, { withGas: true, withStack: true })) {
 *   console.log(`PC ${inst.pc}: gas ${inst.gas}, stack ${inst.stackEffect}`);
 * }
 *
 * // With range
 * for (const inst of Bytecode.scan(code, { startPc: 2, endPc: 10 })) {
 *   console.log(`Instruction at ${inst.pc}`);
 * }
 * ```
 */
export function* scan(bytecode, options = {}) {
	const {
		withGas = false,
		withStack = false,
		startPc = 0,
		endPc = bytecode.length,
	} = options;

	let pc = startPc;

	while (pc < endPc && pc < bytecode.length) {
		const opcode = bytecode[pc] ?? 0;
		const instruction = { pc, opcode, type: "regular", size: 1 };

		if (isPush(opcode)) {
			const pushSize = getPushSize(opcode);
			const dataStart = pc + 1;
			const dataEnd = Math.min(dataStart + pushSize, bytecode.length);
			const pushData = bytecode.slice(dataStart, dataEnd);

			// Convert push data to bigint value
			let value = 0n;
			for (let i = 0; i < pushData.length; i++) {
				value = (value << 8n) | BigInt(pushData[i] ?? 0);
			}

			instruction.type = "push";
			instruction.size = 1 + pushData.length;
			instruction.value = value;

			pc += instruction.size;
		} else {
			pc += 1;
		}

		// Add gas cost if requested
		if (withGas) {
			instruction.gas = getGasCost(opcode);
		}

		// Add stack effect if requested
		if (withStack) {
			instruction.stackEffect = getStackEffect(opcode);
		}

		yield instruction;
	}
}

/**
 * Get static gas cost for an opcode
 * @param {number} opcode
 * @returns {number | undefined}
 */
function getGasCost(opcode) {
	const gasTable = getGasTable();
	return gasTable.get(opcode);
}

/**
 * Get stack effect for an opcode
 * @param {number} opcode
 * @returns {{ pop: number; push: number } | undefined}
 */
function getStackEffect(opcode) {
	const stackTable = getStackEffectTable();
	return stackTable.get(opcode);
}
