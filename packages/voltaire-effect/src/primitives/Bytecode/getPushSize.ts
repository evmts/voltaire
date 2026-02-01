/**
 * @module getPushSize
 * @description Get PUSH instruction size (pure)
 * @since 0.1.0
 */
import { getPushSize as _getPushSize } from "@tevm/voltaire/Bytecode";

export const getPushSize = (opcode: number): number => _getPushSize(opcode);
