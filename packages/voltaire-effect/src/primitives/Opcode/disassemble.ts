/**
 * @module disassemble
 * @description Disassemble bytecode to opcode instructions (pure)
 * @since 0.1.0
 */
import { Opcode } from "@tevm/voltaire/Opcode";

/**
 * Disassemble bytecode into instructions
 *
 * @param bytecode - Bytecode to disassemble
 * @returns Array of disassembled instructions
 */
export const disassemble = Opcode.disassemble;
export const _disassemble = disassemble;
