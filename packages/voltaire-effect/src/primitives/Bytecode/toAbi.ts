/**
 * @module toAbi
 * @description Extract ABI from bytecode (pure)
 * @since 0.1.0
 */
import { toAbi as _toAbi } from "@tevm/voltaire/Bytecode";
import type { BrandedBytecode, BrandedAbi } from "./types.js";

export const toAbi = (bytecode: BrandedBytecode): BrandedAbi =>
	_toAbi(bytecode);
