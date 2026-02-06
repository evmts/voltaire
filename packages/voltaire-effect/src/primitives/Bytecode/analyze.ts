/**
 * @module analyze
 * @description Bytecode analysis functions (pure)
 * @since 0.1.0
 */
import {
	analyze as _analyze,
	analyzeBlocks as _analyzeBlocks,
	analyzeGas as _analyzeGas,
	analyzeJumpDestinations as _analyzeJumpDestinations,
	analyzeStack as _analyzeStack,
} from "@tevm/voltaire/Bytecode";
import type {
	BrandedBytecode,
	Analysis,
	BasicBlock,
	BlockAnalysisOptions,
	GasAnalysis,
	GasAnalysisOptions,
	StackAnalysis,
	StackAnalysisOptions,
} from "./types.js";

/**
 * Analyze bytecode for jump destinations and instructions
 */
export const analyze = (code: BrandedBytecode): Analysis => _analyze(code);

/**
 * Analyze bytecode into basic blocks
 */
export const analyzeBlocks = (
	bytecode: BrandedBytecode,
	options?: BlockAnalysisOptions,
): BasicBlock[] => _analyzeBlocks(bytecode, options);

/**
 * Analyze gas costs in bytecode
 */
export const analyzeGas = (
	bytecode: BrandedBytecode,
	options?: GasAnalysisOptions,
): GasAnalysis => _analyzeGas(bytecode, options);

/**
 * Analyze jump destinations in bytecode
 */
export const analyzeJumpDestinations = (
	code: BrandedBytecode,
): ReadonlySet<number> => _analyzeJumpDestinations(code);

/**
 * Analyze stack effects in bytecode
 */
export const analyzeStack = (
	bytecode: BrandedBytecode,
	options?: StackAnalysisOptions,
): StackAnalysis => _analyzeStack(bytecode, options);
