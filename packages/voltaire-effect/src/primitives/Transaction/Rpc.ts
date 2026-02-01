/**
 * @fileoverview Effect Schema for Transaction RPC format.
 *
 * Provides bidirectional transformation between JSON-RPC transaction format
 * and internal Transaction types.
 *
 * @module Transaction/Rpc
 * @since 0.1.0
 *
 * @example
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 * import * as S from 'effect/Schema'
 *
 * // Decode from RPC format
 * const tx = S.decodeSync(Transaction.Rpc)({
 *   type: '0x2',
 *   chainId: '0x1',
 *   nonce: '0x0',
 *   // ...
 * })
 *
 * // Encode to RPC format
 * const rpc = S.encodeSync(Transaction.Rpc)(tx)
 * ```
 */

import * as VoltaireTransaction from "@tevm/voltaire/Transaction";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { Any } from "./index.js";

/**
 * RPC transaction format from JSON-RPC responses.
 */
export type RpcTransaction = {
	readonly type?: string;
	readonly nonce?: string;
	readonly gasLimit?: string;
	readonly gas?: string;
	readonly to?: string | null;
	readonly value?: string;
	readonly data?: string;
	readonly input?: string;
	readonly r?: string;
	readonly s?: string;
	readonly v?: string;
	readonly yParity?: string;
	readonly chainId?: string;
	readonly gasPrice?: string;
	readonly maxPriorityFeePerGas?: string;
	readonly maxFeePerGas?: string;
	readonly maxFeePerBlobGas?: string;
	readonly accessList?: readonly {
		readonly address: string;
		readonly storageKeys?: readonly string[];
	}[];
	readonly blobVersionedHashes?: readonly string[];
	readonly authorizationList?: readonly {
		readonly chainId: string;
		readonly address: string;
		readonly nonce: string;
		readonly yParity: string;
		readonly r: string;
		readonly s: string;
	}[];
};

/**
 * Internal schema for transaction type validation.
 * @internal
 */
const TransactionTypeSchema = S.declare<Any>(
	(u): u is Any => typeof u === "object" && u !== null && "type" in u,
	{ identifier: "Transaction" },
);

/**
 * Effect Schema for Transaction RPC format.
 *
 * @description
 * Bidirectional schema that transforms between JSON-RPC transaction format
 * and internal Transaction type. Handles hex string conversions for all
 * numeric and byte fields.
 *
 * @example Decoding from RPC
 * ```typescript
 * import * as Transaction from 'voltaire-effect/primitives/Transaction'
 * import * as S from 'effect/Schema'
 *
 * const tx = S.decodeSync(Transaction.Rpc)({
 *   type: '0x2',
 *   chainId: '0x1',
 *   nonce: '0x0',
 *   maxPriorityFeePerGas: '0x3b9aca00',
 *   maxFeePerGas: '0x6fc23ac00',
 *   gasLimit: '0x5208',
 *   to: '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
 *   value: '0xde0b6b3a7640000',
 *   data: '0x',
 *   accessList: [],
 * })
 * ```
 *
 * @example Encoding to RPC
 * ```typescript
 * const rpc = S.encodeSync(Transaction.Rpc)(tx)
 * // { type: '0x2', chainId: '0x1', nonce: '0x0', ... }
 * ```
 *
 * @since 0.1.0
 */
export const Rpc: S.Schema<Any, RpcTransaction> = S.transformOrFail(
	S.Struct({
		type: S.optional(S.String),
		nonce: S.optional(S.String),
		gasLimit: S.optional(S.String),
		gas: S.optional(S.String),
		to: S.optional(S.NullOr(S.String)),
		value: S.optional(S.String),
		data: S.optional(S.String),
		input: S.optional(S.String),
		r: S.optional(S.String),
		s: S.optional(S.String),
		v: S.optional(S.String),
		yParity: S.optional(S.String),
		chainId: S.optional(S.String),
		gasPrice: S.optional(S.String),
		maxPriorityFeePerGas: S.optional(S.String),
		maxFeePerGas: S.optional(S.String),
		maxFeePerBlobGas: S.optional(S.String),
		accessList: S.optional(
			S.Array(
				S.Struct({
					address: S.String,
					storageKeys: S.optional(S.Array(S.String)),
				}),
			),
		),
		blobVersionedHashes: S.optional(S.Array(S.String)),
		authorizationList: S.optional(
			S.Array(
				S.Struct({
					chainId: S.String,
					address: S.String,
					nonce: S.String,
					yParity: S.String,
					r: S.String,
					s: S.String,
				}),
			),
		),
	}),
	TransactionTypeSchema,
	{
		strict: true,
		decode: (rpc, _options, ast) => {
			try {
				return ParseResult.succeed(
					VoltaireTransaction.fromRpc(
						rpc as unknown as Parameters<typeof VoltaireTransaction.fromRpc>[0],
					) as Any,
				);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, rpc, (e as Error).message),
				);
			}
		},
		encode: (tx, _options, _ast) => {
			return ParseResult.succeed(
				VoltaireTransaction.toRpc(tx) as RpcTransaction,
			);
		},
	},
).annotations({ identifier: "Transaction.Rpc" });
