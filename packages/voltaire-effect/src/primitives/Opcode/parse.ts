/**
 * @module parse
 * @description Parse opcode from number or string (pure)
 * @since 0.1.0
 */
import { Opcode } from "@tevm/voltaire/Opcode";

/**
 * Parse an opcode from number or name string
 *
 * @param value - Opcode number or name
 * @returns Opcode value
 */
export const parse = Opcode.parse;
export const _parse = parse;
