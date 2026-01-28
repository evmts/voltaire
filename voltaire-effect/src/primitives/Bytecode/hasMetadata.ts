/**
 * @module hasMetadata
 * @description Check if bytecode has CBOR metadata (pure)
 * @since 0.1.0
 */
import { hasMetadata as _hasMetadata } from "@tevm/voltaire/Bytecode";
import type { BrandedBytecode } from "./types.js";

export const hasMetadata = (code: BrandedBytecode): boolean =>
	_hasMetadata(code);
