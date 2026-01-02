// @ts-nocheck
import * as Opcode from "../Opcode/index.js";
import { isPush } from "./isPush.js";
import { isTerminatorOpcode } from "./isTerminatorOpcode.js";

/**
 * Build blocks from instructions
 * @param {Array<import('./BytecodeType.js').Instruction>} instructions
 * @param {Set<number>} boundaries
 * @param {Set<number>} jumpDests
 * @returns {Array<import('./BytecodeType.js').BasicBlock>}
 */
export function buildBlocks(instructions, boundaries, _jumpDests) {
	const blocks = [];
	let blockIndex = 0;
	let currentBlockStart = 0;
	let currentBlockInsts = [];

	for (let i = 0; i < instructions.length; i++) {
		const inst = instructions[i];

		// Start new block at boundaries (except first instruction)
		if (boundaries.has(inst.position) && currentBlockInsts.length > 0) {
			// Finish current block
			const block = finalizeBlock(
				blockIndex++,
				currentBlockStart,
				currentBlockInsts,
				instructions,
				i - 1,
			);
			blocks.push(block);

			// Start new block
			currentBlockStart = inst.position;
			currentBlockInsts = [inst];
		} else {
			// Set start position if starting new block
			if (currentBlockInsts.length === 0) {
				currentBlockStart = inst.position;
			}
			currentBlockInsts.push(inst);
		}

		// If this is a terminator, finish block
		if (isTerminatorOpcode(inst.opcode)) {
			const block = finalizeBlock(
				blockIndex++,
				currentBlockStart,
				currentBlockInsts,
				instructions,
				i,
			);
			blocks.push(block);

			currentBlockStart = -1;
			currentBlockInsts = [];
		}
	}

	// Finish final block if not terminated
	if (currentBlockInsts.length > 0) {
		const block = finalizeBlock(
			blockIndex++,
			currentBlockStart,
			currentBlockInsts,
			instructions,
			instructions.length - 1,
		);
		blocks.push(block);
	}

	return blocks;
}

/**
 * Finalize a basic block
 * @param {number} index
 * @param {number} startPc
 * @param {Array<import('./BytecodeType.js').Instruction>} blockInsts
 * @param {Array<import('./BytecodeType.js').Instruction>} allInsts
 * @param {number} lastInstIndex
 * @returns {import('./BytecodeType.js').BasicBlock}
 */
function finalizeBlock(index, startPc, blockInsts, allInsts, lastInstIndex) {
	const lastInst = blockInsts[blockInsts.length - 1];
	const endPc = calculateEndPc(lastInst);

	// Calculate gas and stack
	const { gasEstimate, minStack, maxStack, stackEffect } =
		analyzeBlockMetrics(blockInsts);

	// Determine terminator
	const { terminator, target } = analyzeTerminator(
		blockInsts,
		allInsts,
		lastInstIndex,
	);

	return {
		index,
		startPc,
		endPc,
		instructionCount: blockInsts.length,
		gasEstimate,
		minStack,
		maxStack,
		stackEffect,
		terminator,
		target,
		isReachable: false, // Will be set by reachability analysis
		successors: [],
		predecessors: [],
	};
}

/**
 * Calculate end PC for a block
 * @param {import('./BytecodeType.js').Instruction} lastInst
 * @returns {number}
 */
function calculateEndPc(lastInst) {
	let size = 1;
	if (isPush(lastInst.opcode) && lastInst.pushData) {
		size += lastInst.pushData.length;
	}
	return lastInst.position + size;
}

/**
 * Analyze gas and stack metrics for a block
 * @param {Array<import('./BytecodeType.js').Instruction>} blockInsts
 * @returns {{ gasEstimate: number, minStack: number, maxStack: number, stackEffect: number }}
 */
function analyzeBlockMetrics(blockInsts) {
	let gasEstimate = 0;
	let stackDepth = 0;
	let minStack = 0;
	let maxStack = 0;

	for (const inst of blockInsts) {
		const opcode = inst.opcode;

		// Add gas cost
		const gas = Opcode.getGasCost(opcode) ?? 0;
		gasEstimate += gas;

		// Update stack depth
		const inputs = Opcode.getStackInput(opcode) ?? 0;
		const outputs = Opcode.getStackOutput(opcode) ?? 0;

		stackDepth -= inputs;
		minStack = Math.min(minStack, stackDepth);
		stackDepth += outputs;
		maxStack = Math.max(maxStack, stackDepth);
	}

	return {
		gasEstimate,
		minStack: Math.abs(minStack), // Required stack items at entry
		maxStack,
		stackEffect: stackDepth,
	};
}

/**
 * Analyze block terminator
 * @param {Array<import('./BytecodeType.js').Instruction>} blockInsts
 * @param {Array<import('./BytecodeType.js').Instruction>} allInsts
 * @param {number} lastInstIndex
 * @returns {{ terminator: import('./BytecodeType.js').TerminatorType, target?: number }}
 */
function analyzeTerminator(blockInsts, allInsts, lastInstIndex) {
	const lastInst = blockInsts[blockInsts.length - 1];
	const opcode = lastInst.opcode;

	// Explicit terminators
	if (opcode === Opcode.STOP) {
		return { terminator: "stop" };
	}
	if (opcode === Opcode.RETURN) {
		return { terminator: "return" };
	}
	if (opcode === Opcode.REVERT) {
		return { terminator: "revert" };
	}
	if (opcode === Opcode.INVALID) {
		return { terminator: "invalid" };
	}
	if (opcode === Opcode.SELFDESTRUCT) {
		return { terminator: "selfdestruct" };
	}

	// Jump instructions
	if (opcode === Opcode.JUMP) {
		const target = extractJumpTarget(blockInsts);
		return { terminator: "jump", target };
	}
	if (opcode === Opcode.JUMPI) {
		const target = extractJumpTarget(blockInsts);
		return { terminator: "jumpi", target };
	}

	// Check if next instruction exists
	if (lastInstIndex + 1 < allInsts.length) {
		return { terminator: "fallthrough" };
	}

	// End of bytecode without explicit terminator
	return { terminator: "stop" };
}

/**
 * Extract static jump target from PUSH+JUMP(I) pattern
 * @param {Array<import('./BytecodeType.js').Instruction>} blockInsts
 * @returns {number | undefined}
 */
function extractJumpTarget(blockInsts) {
	if (blockInsts.length < 2) {
		return undefined;
	}

	const _lastInst = blockInsts[blockInsts.length - 1];
	const prevInst = blockInsts[blockInsts.length - 2];

	// Check for PUSH+JUMP(I) pattern
	if (isPush(prevInst.opcode) && prevInst.pushData) {
		// Convert push data to number (target PC)
		let target = 0;
		for (let i = 0; i < prevInst.pushData.length; i++) {
			target = (target << 8) | (prevInst.pushData[i] ?? 0);
		}
		return target;
	}

	return undefined;
}
