/**
 * @module TransactionHash
 * @description Effect Schemas for 32-byte Ethereum transaction hashes.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as TransactionHash from 'voltaire-effect/primitives/TransactionHash'
 *
 * function getTransactionByHash(hash: TransactionHash.TransactionHashType): Transaction {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `TransactionHash.Hex` | hex string | TransactionHashType |
 * | `TransactionHash.Bytes` | Uint8Array | TransactionHashType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as TransactionHash from 'voltaire-effect/primitives/TransactionHash'
 * import * as S from 'effect/Schema'
 *
 * // Decode (parse input)
 * const hash = S.decodeSync(TransactionHash.Hex)('0x88df016...')
 *
 * // Encode (format output)
 * const hex = S.encodeSync(TransactionHash.Hex)(hash)
 * ```
 *
 * ## Pure Functions
 *
 * - `equals(a, b)` - Compare two transaction hashes
 * - `toHex(hash)` - Convert to hex string
 *
 * @since 0.1.0
 */

// Schemas
export { Bytes } from "./Bytes.js";
export { Hex } from "./Hex.js";

// Re-export pure functions from voltaire
import { TransactionHash } from "@tevm/voltaire";

export const equals = (a: TransactionHashType, b: TransactionHashType): boolean =>
	TransactionHash.equals(a as unknown as Parameters<typeof TransactionHash.equals>[0], b as unknown as Parameters<typeof TransactionHash.equals>[1]);
export const toHex = (
	hash: Uint8Array & { readonly __tag: "TransactionHash" },
): string => TransactionHash.toHex(hash as unknown as Parameters<typeof TransactionHash.toHex>[0]);

// Type export
export type TransactionHashType = Uint8Array & {
	readonly __tag: "TransactionHash";
};
