/**
 * @module toBytes
 * @description Encode access list to RLP
 * @since 0.1.0
 */
import { AccessList, type BrandedAccessList } from "@tevm/voltaire/AccessList";

/**
 * Encode access list to RLP
 *
 * Format: [[address, [storageKey1, storageKey2, ...]], ...]
 *
 * @param list - Access list to encode
 * @returns RLP-encoded bytes
 * @example
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 *
 * const encoded = AccessList.toBytes(list)
 * ```
 */
export const toBytes = (list: BrandedAccessList): Uint8Array =>
  AccessList.toBytes(list);
