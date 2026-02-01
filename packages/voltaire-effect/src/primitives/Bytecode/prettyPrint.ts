/**
 * @module prettyPrint
 * @description Pretty print bytecode disassembly (pure)
 * @since 0.1.0
 */
import { prettyPrint as _prettyPrint } from "@tevm/voltaire/Bytecode";
import type { BrandedBytecode, PrettyPrintOptions } from "./types.js";

export const prettyPrint = (
	bytecode: BrandedBytecode,
	options?: PrettyPrintOptions,
): string => _prettyPrint(bytecode, options);
