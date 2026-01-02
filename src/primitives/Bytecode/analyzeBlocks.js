// @ts-nocheck
import * as Opcode from "../Opcode/index.js";
import { analyzeJumpDestinations } from "./analyzeJumpDestinations.js";
import { buildBlocks } from "./buildBlocks.js";
import { buildControlFlowGraph } from "./buildControlFlowGraph.js";
import { computeBlockReachability } from "./computeBlockReachability.js";
import { isTerminatorOpcode } from "./isTerminatorOpcode.js";
import { parseInstructions } from "./parseInstructions.js";

/**
 * Analyze bytecode into basic blocks with control flow
 *
 * @param {import('./BytecodeType.js').BrandedBytecode} bytecode
 * @param {import('./BytecodeType.js').BlockAnalysisOptions} [options]
 * @returns {Array<import('./BytecodeType.js').BasicBlock>}
 *
 * @example
 * ```typescript
 * const code = Bytecode.from("0x60016002015b00");
 * const blocks = Bytecode.analyzeBlocks(code, {
 *   buildCFG: true,
 *   computeReachability: true,
 *   includeUnreachable: false
 * });
 * ```
 */
export function analyzeBlocks(bytecode, options = {}) {
	const {
		computeReachability = false,
		buildCFG = false,
		includeUnreachable = true,
		validate = false,
	} = options;

	if (bytecode.length === 0) {
		return [];
	}

	// Parse instructions
	const instructions = parseInstructions(bytecode);
	const jumpDests = analyzeJumpDestinations(bytecode);

	// Find block boundaries
	const boundaries = findBlockBoundaries(instructions, jumpDests);

	// Build blocks
	const blocks = buildBlocks(instructions, boundaries, jumpDests);

	// Build CFG if requested
	if (buildCFG) {
		buildControlFlowGraph(blocks);
	}

	// Compute reachability if requested
	if (computeReachability) {
		computeBlockReachability(blocks, buildCFG);
	}

	// Filter unreachable blocks if requested
	if (computeReachability && !includeUnreachable) {
		return blocks.filter((b) => b.isReachable);
	}

	return blocks;
}

/**
 * Find basic block boundaries
 * @param {Array<import('./BytecodeType.js').Instruction>} instructions
 * @param {Set<number>} jumpDests
 * @returns {Set<number>}
 */
function findBlockBoundaries(instructions, _jumpDests) {
	const boundaries = new Set([0]); // Entry point

	for (let i = 0; i < instructions.length; i++) {
		const inst = instructions[i];
		const opcode = inst.opcode;

		// JUMPDEST starts new block
		if (opcode === Opcode.JUMPDEST) {
			boundaries.add(inst.position);
		}

		// Instruction after terminator starts new block
		if (isTerminatorOpcode(opcode) && i + 1 < instructions.length) {
			const nextInst = instructions[i + 1];
			boundaries.add(nextInst.position);
		}
	}

	return boundaries;
}
