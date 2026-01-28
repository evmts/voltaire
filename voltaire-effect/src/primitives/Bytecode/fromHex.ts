/**
 * @module fromHex
 * @description Create Bytecode from hex string with Effect error handling
 * @since 0.1.0
 */
import { Effect } from "effect";
import { fromHex as _fromHex } from "@tevm/voltaire/Bytecode";
import type { BrandedBytecode } from "./types.js";

export const fromHex = (hex: string): Effect.Effect<BrandedBytecode, Error> =>
	Effect.try({
		try: () => _fromHex(hex),
		catch: (e) => e as Error,
	});
