// @ts-nocheck
import * as Opcode from "../../Opcode/BrandedOpcode/index.js";
import { analyzeJumpDestinations } from "./analyzeJumpDestinations.js";
import { getPushSize } from "./getPushSize.js";
import { isPush } from "./isPush.js";
import { parseInstructions } from "./parseInstructions.js";

/**
 * Analyze bytecode into basic blocks with control flow
 *
 * @param {import('./BrandedBytecode.ts').BrandedBytecode} bytecode
 * @param {import('./BrandedBytecode.ts').BlockAnalysisOptions} [options]
 * @returns {Array<import('./BrandedBytecode.ts').BasicBlock>}
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
 * @param {Array<import('./BrandedBytecode.ts').Instruction>} instructions
 * @param {Set<number>} jumpDests
 * @returns {Set<number>}
 */
function findBlockBoundaries(instructions, jumpDests) {
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

/**
 * Build blocks from instructions
 * @param {Array<import('./BrandedBytecode.ts').Instruction>} instructions
 * @param {Set<number>} boundaries
 * @param {Set<number>} jumpDests
 * @returns {Array<import('./BrandedBytecode.ts').BasicBlock>}
 */
function buildBlocks(instructions, boundaries, jumpDests) {
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
 * @param {Array<import('./BrandedBytecode.ts').Instruction>} blockInsts
 * @param {Array<import('./BrandedBytecode.ts').Instruction>} allInsts
 * @param {number} lastInstIndex
 * @returns {import('./BrandedBytecode.ts').BasicBlock}
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
 * @param {import('./BrandedBytecode.ts').Instruction} lastInst
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
 * @param {Array<import('./BrandedBytecode.ts').Instruction>} blockInsts
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
 * @param {Array<import('./BrandedBytecode.ts').Instruction>} blockInsts
 * @param {Array<import('./BrandedBytecode.ts').Instruction>} allInsts
 * @param {number} lastInstIndex
 * @returns {{ terminator: import('./BrandedBytecode.ts').TerminatorType, target?: number }}
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
 * @param {Array<import('./BrandedBytecode.ts').Instruction>} blockInsts
 * @returns {number | undefined}
 */
function extractJumpTarget(blockInsts) {
	if (blockInsts.length < 2) {
		return undefined;
	}

	const lastInst = blockInsts[blockInsts.length - 1];
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

/**
 * Check if opcode terminates a block
 * @param {number} opcode
 * @returns {boolean}
 */
function isTerminatorOpcode(opcode) {
	return (
		opcode === Opcode.STOP ||
		opcode === Opcode.RETURN ||
		opcode === Opcode.REVERT ||
		opcode === Opcode.INVALID ||
		opcode === Opcode.SELFDESTRUCT ||
		opcode === Opcode.JUMP ||
		opcode === Opcode.JUMPI
	);
}

/**
 * Build control flow graph
 * @param {Array<import('./BrandedBytecode.ts').BasicBlock>} blocks
 */
function buildControlFlowGraph(blocks) {
	// Create PC to block index map
	const pcToBlock = new Map();
	for (const block of blocks) {
		pcToBlock.set(block.startPc, block.index);
	}

	// Build edges
	for (const block of blocks) {
		addBlockEdges(block, blocks, pcToBlock);
	}
}

/**
 * Add CFG edges for a block
 * @param {import('./BrandedBytecode.ts').BasicBlock} block
 * @param {Array<import('./BrandedBytecode.ts').BasicBlock>} blocks
 * @param {Map<number, number>} pcToBlock
 */
function addBlockEdges(block, blocks, pcToBlock) {
	const terminator = block.terminator;

	if (terminator === "jump") {
		addJumpEdge(block, blocks, pcToBlock);
	} else if (terminator === "jumpi") {
		addJumpEdge(block, blocks, pcToBlock);
		addFallthroughEdge(block, blocks);
	} else if (terminator === "fallthrough") {
		addFallthroughEdge(block, blocks);
	}
}

/**
 * Add jump edge
 * @param {import('./BrandedBytecode.ts').BasicBlock} block
 * @param {Array<import('./BrandedBytecode.ts').BasicBlock>} blocks
 * @param {Map<number, number>} pcToBlock
 */
function addJumpEdge(block, blocks, pcToBlock) {
	if (block.target !== undefined) {
		const targetIndex = pcToBlock.get(block.target);
		if (targetIndex !== undefined) {
			block.successors.push(targetIndex);
			blocks[targetIndex].predecessors.push(block.index);
		}
	}
}

/**
 * Add fallthrough edge
 * @param {import('./BrandedBytecode.ts').BasicBlock} block
 * @param {Array<import('./BrandedBytecode.ts').BasicBlock>} blocks
 */
function addFallthroughEdge(block, blocks) {
	const nextBlock = blocks[block.index + 1];
	if (nextBlock) {
		block.successors.push(nextBlock.index);
		nextBlock.predecessors.push(block.index);
	}
}

/**
 * Compute block reachability using BFS
 * @param {Array<import('./BrandedBytecode.ts').BasicBlock>} blocks
 * @param {boolean} hasCFG
 */
function computeBlockReachability(blocks, hasCFG) {
	if (blocks.length === 0) {
		return;
	}

	if (!hasCFG) {
		// If CFG wasn't built, we need to build it temporarily
		buildControlFlowGraph(blocks);
	}

	// BFS from entry block
	const queue = [0];
	const visited = new Set([0]);
	blocks[0].isReachable = true;

	while (queue.length > 0) {
		const blockIndex = queue.shift();
		const block = blocks[blockIndex];

		if (!block) continue;

		for (const successorIndex of block.successors) {
			if (!visited.has(successorIndex)) {
				visited.add(successorIndex);
				blocks[successorIndex].isReachable = true;
				queue.push(successorIndex);
			}
		}
	}
}
