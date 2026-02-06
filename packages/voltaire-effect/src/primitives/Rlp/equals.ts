import { type BrandedRlp, Rlp as VoltaireRlp } from "@tevm/voltaire/Rlp";

/**
 * Checks if two RLP Data structures are equal.
 *
 * @param data - First RLP data structure
 * @param other - Second RLP data structure
 * @returns True if structures are deeply equal
 *
 * @example
 * ```typescript
 * import { equals } from 'voltaire-effect/primitives/Rlp'
 *
 * const a = { type: 'bytes', value: new Uint8Array([1, 2]) }
 * const b = { type: 'bytes', value: new Uint8Array([1, 2]) }
 * equals(a, b) // => true
 * ```
 *
 * @since 0.0.1
 */
export const equals = (data: BrandedRlp, other: BrandedRlp): boolean =>
	VoltaireRlp.equals(data, other);
