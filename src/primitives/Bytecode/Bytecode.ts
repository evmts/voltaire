/**
 * EVM Bytecode Type Definitions
 */

// Re-export types
export type {
	Analysis,
	BrandedBytecode,
	Instruction,
	JumpDest,
	Opcode,
	OpcodeMetadata,
} from "./BrandedBytecode.js";

// For backwards compatibility, export BrandedBytecode as Bytecode
export type { BrandedBytecode as Bytecode } from "./BrandedBytecode.js";
