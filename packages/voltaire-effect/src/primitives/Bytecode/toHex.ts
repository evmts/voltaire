/**
 * @module toHex
 * @description Convert bytecode to hex string (pure)
 * @since 0.1.0
 */
import { toHex as _toHex } from "@tevm/voltaire/Bytecode";
import type { BrandedBytecode } from "./types.js";

export const toHex = (code: BrandedBytecode, prefix?: boolean): string =>
	_toHex(code, prefix);
