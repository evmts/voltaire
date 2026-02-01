/**
 * @module stripMetadata
 * @description Strip CBOR metadata from bytecode (pure)
 * @since 0.1.0
 */
import { stripMetadata as _stripMetadata } from "@tevm/voltaire/Bytecode";
import type { BrandedBytecode } from "./types.js";

export const stripMetadata = (code: BrandedBytecode): BrandedBytecode =>
	_stripMetadata(code);
