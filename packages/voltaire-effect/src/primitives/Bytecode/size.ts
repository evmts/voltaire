/**
 * @module size
 * @description Get bytecode size (pure)
 * @since 0.1.0
 */
import { size as _size } from "@tevm/voltaire/Bytecode";
import type { BrandedBytecode } from "./types.js";

export const size = (code: BrandedBytecode): number => _size(code);
