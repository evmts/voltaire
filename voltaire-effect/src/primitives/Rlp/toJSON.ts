import { type BrandedRlp, Rlp as VoltaireRlp } from "@tevm/voltaire/Rlp";

/**
 * Converts RLP Data to human-readable JSON format.
 *
 * @param data - RLP data structure
 * @returns JSON-serializable representation
 *
 * @example
 * ```typescript
 * import { toJSON } from 'voltaire-effect/primitives/Rlp'
 *
 * const data = { type: 'bytes', value: new Uint8Array([1, 2, 3]) }
 * const json = toJSON(data)
 * // => { type: 'bytes', value: [1, 2, 3] }
 * ```
 *
 * @since 0.0.1
 */
export const toJSON = (data: BrandedRlp): unknown => VoltaireRlp.toJSON(data);
