/**
 * @module dupPosition
 * @description Get DUP instruction position (pure)
 * @since 0.1.0
 */
import { Opcode } from "@tevm/voltaire/Opcode";

/**
 * Get the stack position for a DUP instruction
 *
 * @param opcode - DUP opcode (0x80-0x8f)
 * @returns Stack position (1-16), or 0 if not a DUP
 */
export const dupPosition = Opcode.dupPosition;
export const _dupPosition = dupPosition;
