// @ts-nocheck
import * as Opcode from "../../Opcode/BrandedOpcode/index.js";
import { parseInstructions } from "./parseInstructions.js";

/**
 * Analyze gas costs in bytecode
 *
 * @param {import('./BrandedBytecode.js').BrandedBytecode} bytecode - Bytecode to analyze
 * @param {import('./BrandedBytecode.js').GasAnalysisOptions} [options] - Analysis options
 * @returns {import('./BrandedBytecode.js').GasAnalysis} Gas analysis result
 *
 * @example
 * ```typescript
 * const code = Bytecode.fromHex('0x6001600201');
 * const analysis = Bytecode.analyzeGas(code);
 * console.log(analysis.total); // 9n
 * console.log(analysis.byInstruction); // Per-instruction breakdown
 * ```
 */
export function analyzeGas(bytecode, options = {}) {
	const {
		analyzePaths = false,
		maxPaths = 100,
		includeDynamic = false,
		context,
	} = options;

	// Parse instructions
	const instructions = parseInstructions(bytecode);

	// Calculate gas for each instruction
	let totalGas = 0n;
	const byInstruction = [];
	const expensive = [];

	for (const inst of instructions) {
		const gas = Opcode.getGasCost(inst.opcode) ?? 0;
		totalGas += BigInt(gas);

		const opcodeName = Opcode.getName(inst.opcode);

		byInstruction.push({
			pc: inst.position,
			opcode: opcodeName,
			gas,
			cumulative: totalGas,
		});

		// Track expensive instructions (>1000 gas)
		if (gas > 1000) {
			expensive.push({
				pc: inst.position,
				opcode: opcodeName,
				gas,
				category: Opcode.getCategory(inst.opcode),
			});
		}
	}

	// Aggregate by blocks
	const byBlock = aggregateByBlocks(instructions, byInstruction, totalGas);

	/** @type {import('./BrandedBytecode.js').GasAnalysis} */
	const result = {
		total: totalGas,
		byInstruction,
		byBlock,
		expensive,
	};

	// Path analysis if enabled
	if (analyzePaths) {
		result.paths = analyzeExecutionPaths(instructions, byInstruction, maxPaths);
	}

	return result;
}

/**
 * Aggregate gas costs by basic blocks
 *
 * @param {import('./BrandedBytecode.js').Instruction[]} instructions
 * @param {import('./BrandedBytecode.js').InstructionGas[]} byInstruction
 * @param {bigint} totalGas
 * @returns {import('./BrandedBytecode.js').BlockGas[]}
 */
function aggregateByBlocks(instructions, byInstruction, totalGas) {
	if (instructions.length === 0) return [];

	// Simple block detection: split on JUMPDEST
	const blocks = [];
	let currentBlock = {
		blockIndex: 0,
		startPc: 0,
		endPc: 0,
		gas: 0,
	};

	for (let i = 0; i < instructions.length; i++) {
		const inst = instructions[i];
		const gasInfo = byInstruction[i];

		if (inst.opcode === 0x5b && i > 0) {
			// JUMPDEST - start new block (except at start)
			currentBlock.endPc = inst.position;
			blocks.push(currentBlock);

			currentBlock = {
				blockIndex: blocks.length,
				startPc: inst.position,
				endPc: inst.position,
				gas: 0,
			};
		}

		currentBlock.gas += gasInfo.gas;
		currentBlock.endPc = inst.position;
	}

	// Add final block
	if (currentBlock.startPc <= currentBlock.endPc) {
		blocks.push(currentBlock);
	}

	// Calculate percentages
	const totalGasNum = Number(totalGas);
	for (const block of blocks) {
		block.percentage = totalGasNum > 0 ? (block.gas / totalGasNum) * 100 : 0;
	}

	return blocks;
}

/**
 * Analyze execution paths
 *
 * @param {import('./BrandedBytecode.js').Instruction[]} instructions
 * @param {import('./BrandedBytecode.js').InstructionGas[]} byInstruction
 * @param {number} maxPaths
 * @returns {{ cheapest: import('./BrandedBytecode.js').ExecutionPath, mostExpensive: import('./BrandedBytecode.js').ExecutionPath, average: bigint }}
 */
function analyzeExecutionPaths(instructions, byInstruction, maxPaths) {
	// Simple path analysis: for linear code, there's only one path
	// For branching code (JUMP/JUMPI), we'd need CFG traversal

	// For now, implement simple linear path
	const totalGas =
		byInstruction.length > 0
			? byInstruction[byInstruction.length - 1].cumulative
			: 0n;

	const path = {
		blocks: [0],
		gas: totalGas,
		instructions: instructions.length,
	};

	return {
		cheapest: path,
		mostExpensive: path,
		average: totalGas,
	};
}
