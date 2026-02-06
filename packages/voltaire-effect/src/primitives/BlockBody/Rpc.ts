/**
 * @fileoverview Effect Schema for Ethereum block body from JSON-RPC format.
 * Provides bidirectional transformation between RPC format and BlockBodyType.
 *
 * @module Rpc
 * @since 0.1.0
 */

import { BlockBody } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

type BlockBodyType = BlockBody.BlockBodyType;
type RpcBlockBody = BlockBody.RpcBlockBody;

/**
 * Internal schema declaration for BlockBodyType.
 * Validates that a value has transactions and ommers fields.
 *
 * @internal
 */
const BlockBodyTypeSchema = S.declare<BlockBodyType>(
	(u): u is BlockBodyType => {
		if (typeof u !== "object" || u === null) return false;
		return "transactions" in u && "ommers" in u;
	},
	{ identifier: "BlockBody" },
);

/**
 * Schema for RPC withdrawal format.
 * @internal
 */
const RpcWithdrawalSchema = S.Struct({
	index: S.String,
	validatorIndex: S.String,
	address: S.String,
	amount: S.String,
});

/**
 * Schema for RPC block body input format.
 * Validates the JSON-RPC block body structure.
 *
 * @internal
 */
const RpcBlockBodySchema = S.Struct({
	transactions: S.Array(S.Unknown),
	uncles: S.optional(S.Array(S.Unknown)),
	withdrawals: S.optional(S.Array(RpcWithdrawalSchema)),
});

/**
 * Schema for BlockBody from JSON-RPC response format.
 *
 * @description
 * Transforms RPC block body data to BlockBodyType.
 * Decode converts hex strings and structures to native types.
 * Encode is not currently supported (would need toRpc implementation).
 *
 * @example Decoding
 * ```typescript
 * import * as BlockBody from 'voltaire-effect/primitives/BlockBody'
 * import * as S from 'effect/Schema'
 *
 * const rpcBody = {
 *   transactions: [...],
 *   uncles: [],
 *   withdrawals: []
 * }
 * const body = S.decodeSync(BlockBody.Rpc)(rpcBody)
 * console.log(body.transactions.length)
 * ```
 *
 * @since 0.1.0
 */
export const Rpc: S.Schema<
	BlockBodyType,
	S.Schema.Encoded<typeof RpcBlockBodySchema>
> = S.transformOrFail(RpcBlockBodySchema, BlockBodyTypeSchema, {
	strict: true,
	decode: (rpc, _options, ast) => {
		try {
			return ParseResult.succeed(BlockBody.fromRpc(rpc as RpcBlockBody));
		} catch (e) {
			return ParseResult.fail(
				new ParseResult.Type(ast, rpc, (e as Error).message),
			);
		}
	},
	encode: (_body, _options, ast) => {
		return ParseResult.fail(
			new ParseResult.Type(
				ast,
				_body,
				"Encoding BlockBody to RPC format is not yet supported",
			),
		);
	},
}).annotations({ identifier: "BlockBody.Rpc" });
