import type { brand } from "../../../brand.js";

/**
 * Branded type for EVM opcodes (number 0x00-0xFF)
 */
export type BrandedOpcode = number & { readonly [brand]: "Opcode" };

/**
 * Instruction with opcode and optional immediate data
 */
export type Instruction = {
	/** Program counter offset */
	offset: number;
	/** The opcode */
	opcode: BrandedOpcode;
	/** Immediate data for PUSH operations */
	immediate?: Uint8Array;
};

/**
 * Opcode metadata structure
 */
export type Info = {
	/** Base gas cost (may be dynamic at runtime) */
	gasCost: number;
	/** Number of stack items consumed */
	stackInputs: number;
	/** Number of stack items produced */
	stackOutputs: number;
	/** Opcode name */
	name: string;
};
