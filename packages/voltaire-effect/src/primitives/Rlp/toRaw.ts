import { type BrandedRlp, Rlp as VoltaireRlp } from "@tevm/voltaire/Rlp";

/**
 * Converts RLP Data structure to raw JavaScript values.
 *
 * @param data - RLP data structure to convert
 * @returns Raw value (Uint8Array for bytes, array for list)
 *
 * @example
 * ```typescript
 * import { toRaw } from 'voltaire-effect/primitives/Rlp'
 *
 * const data = { type: 'bytes', value: new Uint8Array([1, 2, 3]) }
 * const raw = toRaw(data)
 * // => Uint8Array([1, 2, 3])
 *
 * const listData = {
 *   type: 'list',
 *   value: [
 *     { type: 'bytes', value: new Uint8Array([1]) },
 *     { type: 'bytes', value: new Uint8Array([2]) }
 *   ]
 * }
 * const rawList = toRaw(listData)
 * // => [Uint8Array([1]), Uint8Array([2])]
 * ```
 *
 * @since 0.0.1
 */
export const toRaw = (data: BrandedRlp): Uint8Array | unknown[] =>
	VoltaireRlp.toRaw(data);
