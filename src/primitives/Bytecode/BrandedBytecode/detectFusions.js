import { getPushSize } from "./getPushSize.js";
import { isPush } from "./isPush.js";

/**
 * Opcode constants
 */
const ADD = 0x01;
const MUL = 0x02;
const SUB = 0x03;
const DIV = 0x04;
const POP = 0x50;
const JUMP = 0x56;
const JUMPI = 0x57;
const DUP1 = 0x80;
const DUP16 = 0x8f;
const SWAP1 = 0x90;
const SWAP16 = 0x9f;

/**
 * Detect fusion patterns in bytecode
 *
 * Scans bytecode for multi-instruction patterns that can be represented
 * as synthetic opcodes (0x100+). Returns array of detected fusions with
 * their type, position, and length.
 *
 * @param {import('./BrandedBytecode.ts').BrandedBytecode} bytecode - Bytecode to scan
 * @returns {Array<{type: string, pc: number, length: number}>} Detected fusion patterns
 *
 * @example
 * ```typescript
 * // PUSH1 0x05, ADD
 * const code = Bytecode.from(new Uint8Array([0x60, 0x05, 0x01]));
 * const fusions = Bytecode.detectFusions(code);
 * // [{type: 'push_add', pc: 0, length: 3}]
 * ```
 */
export function detectFusions(bytecode) {
	const fusions = [];
	let pc = 0;

	while (pc < bytecode.length) {
		const opcode = bytecode[pc];

		// Check for PUSH-based fusions
		if (isPush(opcode)) {
			const pushSize = getPushSize(opcode);
			const nextPc = pc + 1 + pushSize;

			// Ensure we have enough bytes for the PUSH data and next opcode
			if (nextPc >= bytecode.length) {
				break;
			}

			const nextOpcode = bytecode[nextPc];

			// PUSH + arithmetic/logic operations
			if (nextOpcode === ADD) {
				fusions.push({
					type: "push_add",
					pc,
					length: 1 + pushSize + 1,
				});
				pc = nextPc + 1;
				continue;
			}

			if (nextOpcode === MUL) {
				fusions.push({
					type: "push_mul",
					pc,
					length: 1 + pushSize + 1,
				});
				pc = nextPc + 1;
				continue;
			}

			if (nextOpcode === SUB) {
				fusions.push({
					type: "push_sub",
					pc,
					length: 1 + pushSize + 1,
				});
				pc = nextPc + 1;
				continue;
			}

			if (nextOpcode === DIV) {
				fusions.push({
					type: "push_div",
					pc,
					length: 1 + pushSize + 1,
				});
				pc = nextPc + 1;
				continue;
			}

			// PUSH + control flow
			if (nextOpcode === JUMP) {
				fusions.push({
					type: "push_jump",
					pc,
					length: 1 + pushSize + 1,
				});
				pc = nextPc + 1;
				continue;
			}

			if (nextOpcode === JUMPI) {
				fusions.push({
					type: "push_jumpi",
					pc,
					length: 1 + pushSize + 1,
				});
				pc = nextPc + 1;
				continue;
			}

			// PUSH + stack operations
			if (nextOpcode >= DUP1 && nextOpcode <= DUP16) {
				fusions.push({
					type: "push_dup",
					pc,
					length: 1 + pushSize + 1,
				});
				pc = nextPc + 1;
				continue;
			}

			if (nextOpcode >= SWAP1 && nextOpcode <= SWAP16) {
				fusions.push({
					type: "push_swap",
					pc,
					length: 1 + pushSize + 1,
				});
				pc = nextPc + 1;
				continue;
			}

			// No fusion, skip PUSH instruction
			pc = nextPc;
			continue;
		}

		// Check for DUP + SWAP fusion (depths must match)
		if (opcode >= DUP1 && opcode <= DUP16) {
			const nextPc = pc + 1;
			if (nextPc < bytecode.length) {
				const nextOpcode = bytecode[nextPc];
				const dupDepth = opcode - DUP1 + 1;

				if (nextOpcode >= SWAP1 && nextOpcode <= SWAP16) {
					const swapDepth = nextOpcode - SWAP1 + 1;

					if (dupDepth === swapDepth) {
						fusions.push({
							type: "dup_swap",
							pc,
							length: 2,
						});
						pc = nextPc + 1;
						continue;
					}
				}
			}
		}

		// Check for SWAP + POP fusion
		if (opcode >= SWAP1 && opcode <= SWAP16) {
			const nextPc = pc + 1;
			if (nextPc < bytecode.length) {
				const nextOpcode = bytecode[nextPc];

				if (nextOpcode === POP) {
					fusions.push({
						type: "swap_pop",
						pc,
						length: 2,
					});
					pc = nextPc + 1;
					continue;
				}
			}
		}

		// No fusion detected, advance PC
		pc++;
	}

	return fusions;
}
