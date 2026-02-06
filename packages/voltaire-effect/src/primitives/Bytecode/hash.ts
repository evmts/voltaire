/**
 * @module hash
 * @description Compute bytecode hash (pure)
 * @since 0.1.0
 */
import { hash as _hash } from "@tevm/voltaire/Bytecode";
import type { BrandedBytecode } from "./types.js";

export const hash = (code: BrandedBytecode): string => _hash(code);
