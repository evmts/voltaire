/**
 * @fileoverview Parses JSON string to ABI array.
 * Provides Effect-based wrapper for parsing ABI definitions from JSON.
 *
 * @module Abi/parse
 * @since 0.0.1
 */

import { Abi } from "@tevm/voltaire/Abi";
import { AbstractError } from "@tevm/voltaire/errors";
import * as Effect from "effect/Effect";

/**
 * Error thrown when JSON parsing fails.
 */
export class AbiParseError extends AbstractError {
	readonly _tag = "AbiParseError" as const;
	constructor(
		message: string,
		options?: {
			code?: number;
			context?: Record<string, unknown>;
			cause?: Error;
		},
	) {
		super(message, options);
		this.name = "AbiParseError";
	}
}

/**
 * Parses a JSON string to an ABI array.
 *
 * @description
 * Parses a JSON string representing an Ethereum ABI into a structured
 * ABI array that can be used with other ABI functions.
 *
 * @param {string} jsonString - The JSON string to parse.
 * @returns {Effect.Effect<ReturnType<typeof Abi>, AbiParseError>}
 *   Effect yielding the parsed ABI array.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { parse } from 'voltaire-effect/primitives/Abi'
 *
 * const abiJson = '[{"type":"function","name":"transfer",...}]'
 * const abi = await Effect.runPromise(parse(abiJson))
 * ```
 *
 * @since 0.0.1
 */
export const parse = (
	jsonString: string,
): Effect.Effect<ReturnType<typeof Abi>, AbiParseError> =>
	Effect.try({
		try: () => Abi(JSON.parse(jsonString)),
		catch: (e) =>
			new AbiParseError(
				`Failed to parse ABI JSON: ${e instanceof Error ? e.message : String(e)}`,
				{ cause: e instanceof Error ? e : undefined },
			),
	});
