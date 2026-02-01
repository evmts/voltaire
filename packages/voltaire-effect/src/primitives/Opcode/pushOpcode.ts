/**
 * @module pushOpcode
 * @description Get PUSH opcode for given byte count (pure)
 * @since 0.1.0
 */
import { Opcode } from "@tevm/voltaire/Opcode";

/**
 * Get the PUSH opcode for a given number of bytes
 *
 * @param n - Number of bytes (0-32)
 * @returns PUSH opcode (PUSH0-PUSH32)
 */
export const pushOpcode = Opcode.pushOpcode;
export const _pushOpcode = pushOpcode;
