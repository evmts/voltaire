/**
 * @module format
 * @description Format bytecode instructions (pure)
 * @since 0.1.0
 */
import {
	formatInstruction as _formatInstruction,
	formatInstructions as _formatInstructions,
} from "@tevm/voltaire/Bytecode";
import type { BrandedBytecode, Instruction } from "./types.js";

export const formatInstruction = (inst: Instruction): string =>
	_formatInstruction(inst);

export const formatInstructions = (code: BrandedBytecode): string[] =>
	_formatInstructions(code);
