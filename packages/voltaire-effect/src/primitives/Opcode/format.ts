/**
 * @module format
 * @description Format opcode to string (pure)
 * @since 0.1.0
 */
import { Opcode } from "@tevm/voltaire/Opcode";

/**
 * Format an opcode to human-readable string
 *
 * @param opcode - Opcode to format
 * @returns Formatted string (e.g., "PUSH1", "ADD")
 */
export const format = Opcode.format;
export const _format = format;
