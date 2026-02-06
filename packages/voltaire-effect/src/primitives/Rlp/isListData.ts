import { type BrandedRlp, Rlp as VoltaireRlp } from "@tevm/voltaire/Rlp";

/**
 * Checks if value is RLP list data.
 *
 * @param value - Value to check
 * @returns True if value is RLP list data structure
 *
 * @example
 * ```typescript
 * import { isListData } from 'voltaire-effect/primitives/Rlp'
 *
 * isListData({ type: 'list', value: [] }) // => true
 * isListData({ type: 'bytes', value: new Uint8Array([1]) }) // => false
 * ```
 *
 * @since 0.0.1
 */
export const isListData = (
	value: unknown,
): value is BrandedRlp & { type: "list" } => VoltaireRlp.isListData(value);
