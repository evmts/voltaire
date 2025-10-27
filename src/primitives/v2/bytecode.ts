/**
 * EVM bytecode utilities and validation
 *
 * Provides abstractions for working with EVM bytecode,
 * including jump destination analysis and bytecode traversal.
 */

const bytecodeSymbol = Symbol("Bytecode");

/**
 * EVM bytecode (raw bytes)
 */
export type Bytecode = Uint8Array & { __brand: typeof bytecodeSymbol };

/**
 * Analyze bytecode to identify valid JUMPDEST locations
 *
 * This must skip over PUSH instruction immediate data to avoid
 * treating data bytes as instructions.
 *
 * @param code Bytecode to analyze
 * @returns Set of valid JUMPDEST positions
 */
export function analyzeJumpDestinations(code: Bytecode): Set<number> {
	const validJumpdests = new Set<number>();
	let pc = 0;

	while (pc < code.length) {
		const opcode = code[pc];

		// Check if this is a JUMPDEST (0x5b)
		if (opcode === 0x5b) {
			validJumpdests.add(pc);
			pc += 1;
		} else if (opcode >= 0x60 && opcode <= 0x7f) {
			// PUSH1 (0x60) through PUSH32 (0x7f)
			// Calculate number of bytes to push: opcode - 0x5f
			const pushSize = opcode - 0x5f;
			// Skip the PUSH opcode itself and all its immediate data bytes
			pc += 1 + pushSize;
		} else {
			// All other opcodes are single byte
			pc += 1;
		}
	}

	return validJumpdests;
}

/**
 * Check if a position is a valid JUMPDEST
 *
 * @param code Bytecode to check
 * @param pos Position to check
 * @returns true if position is a valid JUMPDEST
 */
export function isValidJumpDest(code: Bytecode, pos: number): boolean {
	const validJumpdests = analyzeJumpDestinations(code);
	return validJumpdests.has(pos);
}

/**
 * Validate bytecode structure
 *
 * Performs basic validation checks on bytecode:
 * - Checks for incomplete PUSH instructions
 * - Validates bytecode can be parsed without errors
 *
 * @param code Bytecode to validate
 * @returns true if bytecode is valid
 */
export function validate(code: Bytecode): boolean {
	let pc = 0;

	while (pc < code.length) {
		const opcode = code[pc];

		if (opcode >= 0x60 && opcode <= 0x7f) {
			// PUSH1 (0x60) through PUSH32 (0x7f)
			const pushSize = opcode - 0x5f;

			// Check if we have enough bytes for the PUSH data
			if (pc + pushSize >= code.length) {
				// Incomplete PUSH instruction
				return false;
			}

			pc += 1 + pushSize;
		} else {
			pc += 1;
		}
	}

	return true;
}

/**
 * Bytecode namespace with methods
 */
export const Bytecode = {
	/**
	 * Analyze bytecode to identify valid JUMPDEST locations
	 */
	analyzeJumpDestinations,

	/**
	 * Check if a position is a valid JUMPDEST
	 */
	isValidJumpDest,

	/**
	 * Validate bytecode structure
	 */
	validate,
};
