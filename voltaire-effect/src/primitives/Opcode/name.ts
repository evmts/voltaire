/**
 * @module name
 * @description Get opcode name (pure)
 * @since 0.1.0
 */
import { Opcode } from "@tevm/voltaire/Opcode";

/**
 * Get the mnemonic name for an opcode
 *
 * @param opcode - Opcode to look up
 * @returns Opcode name (e.g., "ADD", "PUSH1")
 */
export const name = Opcode.name;
export const _name = name;
