/**
 * @fileoverview Effect Schema for Ethereum block from JSON-RPC format.
 * Provides bidirectional transformation between RPC format and BlockType.
 *
 * @module Rpc
 * @since 0.1.0
 */

import { Block } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

type BlockType = Block.BlockType;
type RpcBlock = Block.RpcBlock;

/**
 * Internal schema declaration for BlockType.
 * Validates that a value has header, body, hash, and size fields.
 *
 * @internal
 */
const BlockTypeSchema = S.declare<BlockType>(
	(u): u is BlockType => {
		if (typeof u !== "object" || u === null) return false;
		const block = u as Record<string, unknown>;
		return (
			"header" in block &&
			"body" in block &&
			"hash" in block &&
			block.hash instanceof Uint8Array &&
			"size" in block &&
			typeof block.size === "bigint"
		);
	},
	{ identifier: "Block" },
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
 * Schema for RPC block input format.
 * Combines header and body fields with block-level fields.
 *
 * @internal
 */
const RpcBlockSchema = S.Struct({
	// Block-level fields
	hash: S.String,
	size: S.String,
	totalDifficulty: S.optional(S.String),
	// Header fields
	parentHash: S.String,
	sha3Uncles: S.String,
	miner: S.String,
	stateRoot: S.String,
	transactionsRoot: S.String,
	receiptsRoot: S.String,
	logsBloom: S.String,
	difficulty: S.String,
	number: S.String,
	gasLimit: S.String,
	gasUsed: S.String,
	timestamp: S.String,
	extraData: S.String,
	mixHash: S.String,
	nonce: S.String,
	baseFeePerGas: S.optional(S.String),
	withdrawalsRoot: S.optional(S.String),
	blobGasUsed: S.optional(S.String),
	excessBlobGas: S.optional(S.String),
	parentBeaconBlockRoot: S.optional(S.String),
	// Body fields
	transactions: S.Array(S.Unknown),
	uncles: S.optional(S.Array(S.Unknown)),
	withdrawals: S.optional(S.Array(RpcWithdrawalSchema)),
});

/**
 * Schema for Block from JSON-RPC response format.
 *
 * @description
 * Transforms RPC block data (from eth_getBlockByNumber/Hash) to BlockType.
 * Decode converts hex strings and structures to native types.
 * Encode is not currently supported (would need toRpc implementation).
 *
 * @example Decoding
 * ```typescript
 * import * as Block from 'voltaire-effect/primitives/Block'
 * import * as S from 'effect/Schema'
 *
 * const rpcBlock = await provider.send('eth_getBlockByNumber', ['latest', true])
 * const block = S.decodeSync(Block.Rpc)(rpcBlock)
 * console.log(block.header.number) // bigint
 * console.log(block.body.transactions.length)
 * ```
 *
 * @since 0.1.0
 */
export const Rpc: S.Schema<
	BlockType,
	S.Schema.Encoded<typeof RpcBlockSchema>
> = S.transformOrFail(RpcBlockSchema, BlockTypeSchema, {
	strict: true,
	decode: (rpc, _options, ast) => {
		try {
			return ParseResult.succeed(Block.fromRpc(rpc as RpcBlock));
		} catch (e) {
			return ParseResult.fail(
				new ParseResult.Type(ast, rpc, (e as Error).message),
			);
		}
	},
	encode: (_block, _options, ast) => {
		return ParseResult.fail(
			new ParseResult.Type(
				ast,
				_block,
				"Encoding Block to RPC format is not yet supported",
			),
		);
	},
}).annotations({ identifier: "Block.Rpc" });
