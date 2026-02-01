/**
 * @module isPush
 * @description Check if opcode is a PUSH instruction (pure)
 * @since 0.1.0
 */
import { isPush as _isPush } from "@tevm/voltaire/Bytecode";

export const isPush = (opcode: number): boolean => _isPush(opcode);
