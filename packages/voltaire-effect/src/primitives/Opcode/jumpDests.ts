/**
 * @module jumpDests
 * @description Find jump destinations in bytecode (pure)
 * @since 0.1.0
 */
import { Opcode } from "@tevm/voltaire/Opcode";

/**
 * Find all valid JUMPDEST positions in bytecode
 *
 * @param bytecode - Bytecode to analyze
 * @returns Set of valid jump destination positions
 */
export const jumpDests = Opcode.jumpDests;
export const _jumpDests = jumpDests;
