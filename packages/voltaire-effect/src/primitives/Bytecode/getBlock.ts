/**
 * @module getBlock
 * @description Get basic block at program counter (pure)
 * @since 0.1.0
 */
import { getBlock as _getBlock } from "@tevm/voltaire/Bytecode";
import type { BrandedBytecode, BasicBlock } from "./types.js";

export const getBlock = (
	code: BrandedBytecode,
	pc: number,
): BasicBlock | undefined => _getBlock(code, pc);
