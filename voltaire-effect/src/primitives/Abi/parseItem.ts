/**
 * @fileoverview Parses a single ABI item from JSON string.
 * Provides Effect-based wrapper for parsing individual ABI items.
 *
 * @module Abi/parseItem
 * @since 0.0.1
 */

import type { Item } from "@tevm/voltaire/Abi";
import { AbstractError } from "@tevm/voltaire/errors";
import * as Effect from "effect/Effect";

/**
 * Error thrown when ABI item parsing fails.
 */
export class AbiItemParseError extends AbstractError {
	readonly _tag = "AbiItemParseError" as const;
	constructor(
		message: string,
		options?: {
			code?: number;
			context?: Record<string, unknown>;
			cause?: Error;
		},
	) {
		super(message, options);
		this.name = "AbiItemParseError";
	}
}

/**
 * Parses a JSON string to a single ABI item.
 *
 * @description
 * Parses a JSON string representing a single Ethereum ABI item (function,
 * event, error, etc.) into a structured ABI item object.
 *
 * @param {string} jsonString - The JSON string to parse.
 * @returns {Effect.Effect<Item.ItemType, AbiItemParseError>}
 *   Effect yielding the parsed ABI item.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { parseItem } from 'voltaire-effect/primitives/Abi'
 *
 * const itemJson = '{"type":"function","name":"transfer","inputs":[],"outputs":[]}'
 * const item = await Effect.runPromise(parseItem(itemJson))
 * ```
 *
 * @since 0.0.1
 */
export const parseItem = (
	jsonString: string,
): Effect.Effect<Item.ItemType, AbiItemParseError> =>
	Effect.try({
		try: () => JSON.parse(jsonString) as Item.ItemType,
		catch: (e) =>
			new AbiItemParseError(
				`Failed to parse ABI item JSON: ${e instanceof Error ? e.message : String(e)}`,
				{ cause: e instanceof Error ? e : undefined },
			),
	});
