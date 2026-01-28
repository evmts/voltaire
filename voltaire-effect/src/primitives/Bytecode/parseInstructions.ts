/**
 * @module parseInstructions
 * @description Parse bytecode into instructions (pure)
 * @since 0.1.0
 */
import { parseInstructions as _parseInstructions } from "@tevm/voltaire/Bytecode";
import type { BrandedBytecode, Instruction } from "./types.js";

export const parseInstructions = (code: BrandedBytecode): Instruction[] =>
	_parseInstructions(code);
