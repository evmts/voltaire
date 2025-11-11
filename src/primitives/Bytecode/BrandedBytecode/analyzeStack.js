import { getName } from "../../Opcode/BrandedOpcode/getName.js";
import { getStackInput } from "../../Opcode/BrandedOpcode/getStackInput.js";
import { getStackOutput } from "../../Opcode/BrandedOpcode/getStackOutput.js";
// @ts-nocheck
import { parseInstructions } from "./parseInstructions.js";

/**
 * Analyze stack behavior of bytecode
 *
 * @param {import('./BrandedBytecode.js').BrandedBytecode} bytecode
 * @param {import('./BrandedBytecode.js').StackAnalysisOptions} [options]
 * @returns {import('./BrandedBytecode.js').StackAnalysis}
 */
export function analyzeStack(bytecode, options = {}) {
	const {
		initialDepth = 0,
		maxDepth = 1024,
		analyzePaths = false,
		maxPaths = 100,
		failFast = false,
	} = options;

	/** @type {import('./BrandedBytecode.js').StackIssue[]} */
	const issues = [];
	let maxDepthReached = initialDepth;
	let pathsAnalyzed = 0;

	const instructions = parseInstructions(bytecode);

	if (instructions.length === 0) {
		return {
			valid: true,
			maxDepth: 0,
			issues: [],
			byBlock: [],
			pathsAnalyzed: 1,
		};
	}

	// Simple single-path analysis
	let depth = initialDepth;
	const currentBlock = {
		blockIndex: 0,
		startPc: 0,
		endPc: 0,
		minRequired: initialDepth,
		maxReached: initialDepth,
		exitDepth: initialDepth,
		stackEffect: 0,
	};

	/** @type {import('./BrandedBytecode.js').BlockStackInfo[]} */
	const byBlock = [];
	const blockStartPc = 0;

	for (let i = 0; i < instructions.length; i++) {
		const instr = instructions[i];
		if (!instr) continue;

		const { opcode, position } = instr;

		// Get stack inputs/outputs
		const inputs = getStackInput(opcode) ?? 0;
		const outputs = getStackOutput(opcode) ?? 0;

		// Check underflow
		if (depth < inputs) {
			const opcodeName = getName(opcode);
			issues.push({
				type: "underflow",
				pc: position,
				blockIndex: 0,
				expected: inputs,
				actual: depth,
				message: `Stack underflow at ${opcodeName ?? `0x${opcode.toString(16)}`}: requires ${inputs} items, has ${depth}`,
				opcode: opcodeName,
			});

			if (failFast) {
				break;
			}

			// Continue with depth 0 to detect more issues
			depth = 0;
		} else {
			// Update depth
			depth = depth - inputs + outputs;

			// Track max depth
			if (depth > maxDepthReached) {
				maxDepthReached = depth;
			}

			// Check overflow
			if (depth > maxDepth) {
				const opcodeName = getName(opcode);
				issues.push({
					type: "overflow",
					pc: position,
					blockIndex: 0,
					expected: maxDepth,
					actual: depth,
					message: `Stack overflow at ${opcodeName ?? `0x${opcode.toString(16)}`}: depth ${depth} exceeds maximum ${maxDepth}`,
					opcode: opcodeName,
				});

				if (failFast) {
					break;
				}
			}
		}

		// Update block max reached
		if (depth > currentBlock.maxReached) {
			currentBlock.maxReached = depth;
		}

		// Update block end
		currentBlock.endPc = position + 1;
	}

	// Finalize block
	currentBlock.exitDepth = depth;
	currentBlock.stackEffect = depth - initialDepth;
	byBlock.push(currentBlock);

	pathsAnalyzed = 1;

	// Path analysis for JUMP/JUMPI
	if (analyzePaths) {
		// For now, still count as 1 path analyzed
		// Full path analysis would require CFG traversal
		pathsAnalyzed = 1;
	}

	return {
		valid: issues.length === 0,
		maxDepth: maxDepthReached,
		issues,
		byBlock,
		pathsAnalyzed,
	};
}
