/**
 * @module from
 * @description Create Bytecode from various input types with Effect error handling
 * @since 0.1.0
 */
import { Effect } from "effect";
import { from as _from } from "@tevm/voltaire/Bytecode";
import { ValidationError } from "@tevm/voltaire/errors";
import type { BrandedBytecode } from "./types.js";

export const from = (
	value: string | Uint8Array,
): Effect.Effect<BrandedBytecode, ValidationError> =>
	Effect.try({
		try: () => _from(value),
		catch: (error) =>
			new ValidationError(
				error instanceof Error ? error.message : "Invalid bytecode input",
				{
					value,
					expected: "hex string or Uint8Array",
					cause: error instanceof Error ? error : undefined,
				},
			),
	});
