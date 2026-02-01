/**
 * @module swapPosition
 * @description Get SWAP instruction position (pure)
 * @since 0.1.0
 */
import { Opcode } from "@tevm/voltaire/Opcode";

/**
 * Get the stack position for a SWAP instruction
 *
 * @param opcode - SWAP opcode (0x90-0x9f)
 * @returns Stack position (1-16), or 0 if not a SWAP
 */
export const swapPosition = Opcode.swapPosition;
export const _swapPosition = swapPosition;
