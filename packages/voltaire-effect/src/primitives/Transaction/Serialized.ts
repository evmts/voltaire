/**
 * @fileoverview Effect Schema for RLP-serialized transactions.
 *
 * Provides bidirectional transformation between RLP-encoded transaction bytes
 * and internal Transaction types.
 *
 * @module Transaction/Serialized
 * @since 0.1.0
 *
 * @example
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 * import * as S from 'effect/Schema'
 *
 * // Decode from serialized bytes
 * const tx = S.decodeSync(Transaction.Serialized)(rawBytes)
 *
 * // Encode to serialized bytes
 * const bytes = S.encodeSync(Transaction.Serialized)(tx)
 * ```
 */

import * as VoltaireTransaction from "@tevm/voltaire/Transaction";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { Any } from "./index.js";

/**
 * Internal schema for transaction type validation.
 * @internal
 */
const TransactionTypeSchema = S.declare<Any>(
	(u): u is Any => typeof u === "object" && u !== null && "type" in u,
	{ identifier: "Transaction" },
);

/**
 * Effect Schema for RLP-serialized transactions.
 *
 * @description
 * Bidirectional schema that transforms between RLP-encoded transaction bytes
 * and internal Transaction type. Automatically detects transaction type from
 * the encoded bytes.
 *
 * For typed transactions (EIP-2718+), the first byte indicates the type:
 * - 0x01 = EIP-2930
 * - 0x02 = EIP-1559
 * - 0x03 = EIP-4844
 * - 0x04 = EIP-7702
 *
 * Legacy transactions are detected by RLP structure (first byte >= 0xc0).
 *
 * @example Decoding serialized bytes
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 * import * as S from 'effect/Schema'
 *
 * const tx = S.decodeSync(Transaction.Serialized)(rawBytes)
 * console.log(tx.type) // 0, 1, 2, 3, or 4
 * console.log(tx.nonce)
 * ```
 *
 * @example Encoding to bytes
 * ```typescript
 * const bytes = S.encodeSync(Transaction.Serialized)(tx)
 * // Send bytes to network
 * await rpcClient.sendRawTransaction(bytes)
 * ```
 *
 * @since 0.1.0
 */
export const Serialized: S.Schema<Any, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	TransactionTypeSchema,
	{
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(
					VoltaireTransaction.deserialize(bytes) as Any,
				);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (tx, _options, ast) => {
			try {
				return ParseResult.succeed(VoltaireTransaction.serialize(tx));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, tx, (e as Error).message),
				);
			}
		},
	},
).annotations({ identifier: "Transaction.Serialized" });
