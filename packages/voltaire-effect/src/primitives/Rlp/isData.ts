import { type BrandedRlp, Rlp as VoltaireRlp } from "@tevm/voltaire/Rlp";

/**
 * Checks if value is an RLP Data structure.
 *
 * @param value - Value to check
 * @returns True if value is valid RLP data structure
 *
 * @example
 * ```typescript
 * import { isData } from 'voltaire-effect/primitives/Rlp'
 *
 * isData({ type: 'bytes', value: new Uint8Array([1]) }) // => true
 * isData({ type: 'list', value: [] }) // => true
 * isData('invalid') // => false
 * ```
 *
 * @since 0.0.1
 */
export const isData = (value: unknown): value is BrandedRlp =>
	VoltaireRlp.isData(value);
