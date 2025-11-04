/**
 * Branded Bytecode type
 */

/**
 * EVM Bytecode (Uint8Array)
 */
export type BrandedBytecode = Uint8Array & { readonly __tag: "Bytecode" };

/**
 * EVM opcode (single byte instruction)
 */
export type Opcode = number;

/**
 * Jump destination information
 */
export type JumpDest = {
	/** Position in bytecode */
	readonly position: number;
	/** Whether this is a valid jump destination */
	readonly valid: boolean;
};

/**
 * Bytecode instruction
 */
export type Instruction = {
	/** Opcode value */
	readonly opcode: Opcode;
	/** Position in bytecode */
	readonly position: number;
	/** Push data if PUSH instruction */
	readonly pushData?: Uint8Array;
};

/**
 * Bytecode analysis result
 */
export type Analysis = {
	/** Valid JUMPDEST positions */
	readonly jumpDestinations: ReadonlySet<number>;
	/** All instructions */
	readonly instructions: readonly Instruction[];
	/** Whether bytecode is valid */
	readonly valid: boolean;
};

/**
 * Opcode metadata
 */
export type OpcodeMetadata = {
	/** Opcode value */
	readonly opcode: Opcode;
	/** Mnemonic name */
	readonly name: string;
	/** Gas cost (base) */
	readonly gas: number;
	/** Stack items removed */
	readonly inputs: number;
	/** Stack items added */
	readonly outputs: number;
};
