/**
 * @module isTerminator
 * @description Check if opcode is a block terminator (pure)
 * @since 0.1.0
 */
import { isTerminator as _isTerminator } from "@tevm/voltaire/Bytecode";

export const isTerminator = (opcode: number): boolean => _isTerminator(opcode);
