/**
 * @module isValidJumpDest
 * @description Check if offset is a valid jump destination (pure)
 * @since 0.1.0
 */
import { isValidJumpDest as _isValidJumpDest } from "@tevm/voltaire/Bytecode";
import type { BrandedBytecode } from "./types.js";

export const isValidJumpDest = (
	code: BrandedBytecode,
	offset: number,
): boolean => _isValidJumpDest(code, offset);
