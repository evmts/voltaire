/**
 * @module validate
 * @description Validate bytecode structure (pure)
 * @since 0.1.0
 */
import { validate as _validate } from "@tevm/voltaire/Bytecode";
import type { BrandedBytecode } from "./types.js";

export const validate = (code: BrandedBytecode): boolean => _validate(code);
