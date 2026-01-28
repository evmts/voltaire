/**
 * @module equals
 * @description Bytecode equality check (pure)
 * @since 0.1.0
 */
import { equals as _equals } from "@tevm/voltaire/Bytecode";
import type { BrandedBytecode } from "./types.js";

export const equals = (a: BrandedBytecode, b: BrandedBytecode): boolean =>
	_equals(a, b);
