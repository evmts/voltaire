/**
 * @module getNextPc
 * @description Get next program counter after instruction (pure)
 * @since 0.1.0
 */
import { _getNextPc as __getNextPc } from "@tevm/voltaire/Bytecode";
import type { BrandedBytecode } from "./types.js";

export const _getNextPc = (
	code: BrandedBytecode,
	currentPc: number,
): number => __getNextPc(code, currentPc) ?? currentPc + 1;
