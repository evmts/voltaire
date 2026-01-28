/**
 * @module from
 * @description Create Bytecode from various input types with Effect error handling
 * @since 0.1.0
 */
import { Effect } from "effect";
import { from as _from } from "@tevm/voltaire/Bytecode";
import type { BrandedBytecode } from "./types.js";

export const from = (
	value: string | Uint8Array,
): Effect.Effect<BrandedBytecode, Error> =>
	Effect.try({
		try: () => _from(value),
		catch: (e) => e as Error,
	});
