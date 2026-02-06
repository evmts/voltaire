/**
 * @module Bytecode
 * @description Effect Schemas and functions for EVM contract bytecode.
 *
 * Bytecode is the compiled machine code executed by the EVM.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Bytecode from 'voltaire-effect/primitives/Bytecode'
 *
 * function deployContract(code: Bytecode.BrandedBytecode) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Bytecode.Hex` | hex string | BrandedBytecode |
 * | `Bytecode.Bytes` | Uint8Array | BrandedBytecode |
 * | `Bytecode.Schema` | string or Uint8Array | BrandedBytecode |
 *
 * ## Constructors (Effect-wrapped)
 *
 * ```typescript
 * Bytecode.from(value)    // Effect<BrandedBytecode, Error>
 * Bytecode.fromHex(hex)   // Effect<BrandedBytecode, Error>
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * // Analysis
 * Bytecode.analyze(code)                    // Analysis
 * Bytecode.analyzeBlocks(code, opts)        // BasicBlock[]
 * Bytecode.analyzeGas(code, opts)           // GasAnalysis
 * Bytecode.analyzeJumpDestinations(code)    // ReadonlySet<number>
 * Bytecode.analyzeStack(code, opts)         // StackAnalysis
 * Bytecode.detectFusions(code)              // fusion patterns
 *
 * // Comparison
 * Bytecode.equals(a, b)                     // boolean
 *
 * // Extraction
 * Bytecode.extractRuntime(code, offset)     // BrandedBytecode
 * Bytecode.stripMetadata(code)              // BrandedBytecode
 * Bytecode.toAbi(code)                      // BrandedAbi
 *
 * // Formatting
 * Bytecode.formatInstruction(inst)          // string
 * Bytecode.formatInstructions(code)         // string[]
 * Bytecode.prettyPrint(code, opts)          // string
 *
 * // Navigation
 * Bytecode.getBlock(code, pc)               // BasicBlock | undefined
 * Bytecode._getNextPc(code, pc)             // number
 * Bytecode.scan(code, opts)                 // Generator
 *
 * // Predicates
 * Bytecode.getPushSize(opcode)              // number
 * Bytecode.hasMetadata(code)                // boolean
 * Bytecode.isPush(opcode)                   // boolean
 * Bytecode.isTerminator(opcode)             // boolean
 * Bytecode.isValidJumpDest(code, offset)    // boolean
 * Bytecode.validate(code)                   // boolean
 *
 * // Conversion
 * Bytecode.hash(code)                       // string
 * Bytecode.parseInstructions(code)          // Instruction[]
 * Bytecode.size(code)                       // number
 * Bytecode.toHex(code, prefix?)             // string
 * ```
 *
 * @since 0.1.0
 */

// Re-export types
export type {
	BrandedBytecode,
	BrandedAbi,
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
} from "@tevm/voltaire/Bytecode";

export type { BytecodeType } from "./BytecodeSchema.js";

// Schemas
export { Bytes } from "./Bytes.js";
export { Hex } from "./Hex.js";
export { Schema } from "./BytecodeSchema.js";

// Constructors (Effect-wrapped)
export { from } from "./from.js";
export { fromHex } from "./fromHex.js";

// Analysis functions (pure)
export {
	analyze,
	analyzeBlocks,
	analyzeGas,
	analyzeJumpDestinations,
	analyzeStack,
} from "./analyze.js";

// Transformation functions (pure)
export { detectFusions } from "./detectFusions.js";
export { equals } from "./equals.js";
export { extractRuntime } from "./extractRuntime.js";
export { formatInstruction, formatInstructions } from "./format.js";
export { getBlock } from "./getBlock.js";
export { _getNextPc } from "./getNextPc.js";
export { getPushSize } from "./getPushSize.js";
export { hash } from "./hash.js";
export { hasMetadata } from "./hasMetadata.js";
export { isPush } from "./isPush.js";
export { isTerminator } from "./isTerminator.js";
export { isValidJumpDest } from "./isValidJumpDest.js";
export { parseInstructions } from "./parseInstructions.js";
export { prettyPrint } from "./prettyPrint.js";
export { scan } from "./scan.js";
export { size } from "./size.js";
export { stripMetadata } from "./stripMetadata.js";
export { toAbi } from "./toAbi.js";
export { toHex } from "./toHex.js";
export { validate } from "./validate.js";
