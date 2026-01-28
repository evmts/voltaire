/**
 * @module extractRuntime
 * @description Extract runtime bytecode from deploy bytecode (pure)
 * @since 0.1.0
 */
import { extractRuntime as _extractRuntime } from "@tevm/voltaire/Bytecode";
import type { BrandedBytecode } from "./types.js";

export const extractRuntime = (
	code: BrandedBytecode,
	offset: number,
): BrandedBytecode => _extractRuntime(code, offset);
