import { type BrandedRlp, Rlp as VoltaireRlp } from "@tevm/voltaire/Rlp";

/**
 * Checks if value is RLP bytes data.
 *
 * @param value - Value to check
 * @returns True if value is RLP bytes data structure
 *
 * @example
 * ```typescript
 * import { isBytesData } from 'voltaire-effect/primitives/Rlp'
 *
 * isBytesData({ type: 'bytes', value: new Uint8Array([1]) }) // => true
 * isBytesData({ type: 'list', value: [] }) // => false
 * ```
 *
 * @since 0.0.1
 */
export const isBytesData = (
	value: unknown,
): value is BrandedRlp & { type: "bytes" } => VoltaireRlp.isBytesData(value);
