/**
 * @fileoverview Effect-based Bytes concatenation.
 * @module concat
 * @since 0.0.1
 */

import { type BytesType, Bytes as VoltaireBytes } from "@tevm/voltaire/Bytes";
import * as Effect from "effect/Effect";

/**
 * Concatenates multiple Bytes.
 *
 * @param arrays - Bytes to concatenate
 * @returns Effect yielding concatenated BytesType
 *
 * @example
 * ```typescript
 * const result = Effect.runSync(Bytes.concat(bytes1, bytes2, bytes3))
 * ```
 *
 * @since 0.0.1
 */
export const concat = (...arrays: BytesType[]): Effect.Effect<BytesType> =>
	Effect.sync(() => VoltaireBytes.concat(...arrays));
