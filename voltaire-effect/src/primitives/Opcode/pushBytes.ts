/**
 * @module pushBytes
 * @description Get bytes pushed by PUSH opcode (pure)
 * @since 0.1.0
 */
import { Opcode } from "@tevm/voltaire/Opcode";

/**
 * Get the number of bytes pushed by a PUSH opcode
 *
 * @param opcode - PUSH opcode (0x5f-0x7f)
 * @returns Number of bytes (0-32)
 */
export const pushBytes = Opcode.pushBytes;
export const _pushBytes = pushBytes;
