/**
 * @module scan
 * @description Iterator over bytecode instructions (pure)
 * @since 0.1.0
 */
import { scan as _scan } from "@tevm/voltaire/Bytecode";
import type { BrandedBytecode, ScanOptions } from "./types.js";

export const scan = (
	bytecode: BrandedBytecode,
	options?: ScanOptions,
): Generator<{
	pc: number;
	opcode: number;
	type: "push" | "regular";
	size: number;
	value?: bigint;
	gas?: number;
	stackEffect?: { pop: number; push: number };
}> => _scan(bytecode, options);
