/**
 * @module info
 * @description Get full opcode metadata (pure)
 * @since 0.1.0
 */
import { Opcode } from "@tevm/voltaire/Opcode";
import type { Info } from "@tevm/voltaire/Opcode";

/**
 * Get full metadata info for an opcode
 *
 * @param opcode - Opcode to look up
 * @returns Info object with gas, stack effects, name
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const info = (opcode: number): Info | undefined =>
	Opcode.info(opcode as any);
export const _info = info;
