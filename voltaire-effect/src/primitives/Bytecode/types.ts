/**
 * @module types
 * @description Bytecode type re-exports
 * @since 0.1.0
 */

export type {
	Analysis,
	BasicBlock,
	BlockAnalysisOptions,
	GasAnalysis,
	GasAnalysisOptions,
	Instruction,
	PrettyPrintOptions,
	ScanOptions,
	StackAnalysis,
	StackAnalysisOptions,
	BrandedAbi,
} from "@tevm/voltaire/Bytecode";

// Use loose type to avoid brand symbol issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BrandedBytecode = any;
