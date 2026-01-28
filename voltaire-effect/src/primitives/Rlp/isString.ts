import {
	type RlpDecodingError,
	RlpDecodingError as RlpDecodingErrorClass,
	Rlp as VoltaireRlp,
} from "@tevm/voltaire/Rlp";
import * as Effect from "effect/Effect";

const isRlpDecodingError = (e: unknown): e is RlpDecodingError =>
	e instanceof RlpDecodingErrorClass ||
	(e !== null &&
		typeof e === "object" &&
		"name" in e &&
		e.name === "RlpDecodingError");

/**
 * Checks if RLP-encoded data represents a string (byte array).
 *
 * @param data - RLP-encoded data
 * @returns Effect that succeeds with boolean or fails with RlpDecodingError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { isString } from 'voltaire-effect/primitives/Rlp'
 *
 * const bytes = new Uint8Array([0x83, 0x01, 0x02, 0x03])
 * Effect.runSync(isString(bytes)) // => true
 *
 * const list = new Uint8Array([0xc3, 0x01, 0x02, 0x03])
 * Effect.runSync(isString(list)) // => false
 * ```
 *
 * @since 0.0.1
 */
export const isString = (
	data: Uint8Array,
): Effect.Effect<boolean, RlpDecodingError> =>
	Effect.try({
		try: () => VoltaireRlp.isString(data),
		catch: (e) =>
			isRlpDecodingError(e)
				? e
				: new RlpDecodingErrorClass("isString check failed", {
						cause: e instanceof Error ? e : undefined,
					}),
	});
