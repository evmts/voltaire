import {
	type BrandedRlp,
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
 * Converts JSON representation back to RLP Data.
 *
 * @param json - JSON object from toJSON
 * @returns Effect that succeeds with RLP data structure or fails with RlpDecodingError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { fromJSON } from 'voltaire-effect/primitives/Rlp'
 *
 * const json = { type: 'bytes', value: [1, 2, 3] }
 * const data = Effect.runSync(fromJSON(json))
 * // => { type: 'bytes', value: Uint8Array([1, 2, 3]) }
 * ```
 *
 * @since 0.0.1
 */
export const fromJSON = (
	json: unknown,
): Effect.Effect<BrandedRlp, RlpDecodingError> =>
	Effect.try({
		try: () => VoltaireRlp.fromJSON(json),
		catch: (e) =>
			isRlpDecodingError(e)
				? e
				: new RlpDecodingErrorClass("RLP fromJSON failed", {
						cause: e instanceof Error ? e : undefined,
					}),
	});
