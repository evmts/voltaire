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
 * Checks if RLP-encoded data represents a list.
 *
 * @param data - RLP-encoded data
 * @returns Effect that succeeds with boolean or fails with RlpDecodingError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { isList } from 'voltaire-effect/primitives/Rlp'
 *
 * const list = new Uint8Array([0xc3, 0x01, 0x02, 0x03])
 * Effect.runSync(isList(list)) // => true
 *
 * const bytes = new Uint8Array([0x83, 0x01, 0x02, 0x03])
 * Effect.runSync(isList(bytes)) // => false
 * ```
 *
 * @since 0.0.1
 */
export const isList = (
	data: Uint8Array,
): Effect.Effect<boolean, RlpDecodingError> =>
	Effect.try({
		try: () => VoltaireRlp.isList(data),
		catch: (e) =>
			isRlpDecodingError(e)
				? e
				: new RlpDecodingErrorClass("isList check failed", {
						cause: e instanceof Error ? e : undefined,
					}),
	});
