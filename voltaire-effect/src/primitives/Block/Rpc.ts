/**
 * @fileoverview Effect Schema for Ethereum block from JSON-RPC format.
 * Provides bidirectional transformation between RPC format and BlockType.
 *
 * @module Rpc
 * @since 0.1.0
 */

import { Block, Hex } from "@tevm/voltaire";
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
	encode: (block, _options, ast) => {
		try {
			const header = block.header;
			const body = block.body;

			// Convert header fields to hex strings
			const rpc: S.Schema.Encoded<typeof RpcBlockSchema> = {
				// Block-level fields
				hash: Hex.fromBytes(block.hash),
				size: Hex.fromBigInt(block.size),
				...(block.totalDifficulty !== undefined && {
					totalDifficulty: Hex.fromBigInt(block.totalDifficulty),
				}),
				// Header fields
				parentHash: Hex.fromBytes(header.parentHash),
				sha3Uncles: Hex.fromBytes(header.ommersHash),
				miner: Hex.fromBytes(header.beneficiary),
				stateRoot: Hex.fromBytes(header.stateRoot),
				transactionsRoot: Hex.fromBytes(header.transactionsRoot),
				receiptsRoot: Hex.fromBytes(header.receiptsRoot),
				logsBloom: Hex.fromBytes(header.logsBloom),
				difficulty: Hex.fromBigInt(header.difficulty),
				number: Hex.fromBigInt(header.number),
				gasLimit: Hex.fromBigInt(header.gasLimit),
				gasUsed: Hex.fromBigInt(header.gasUsed),
				timestamp: Hex.fromBigInt(header.timestamp),
				extraData: Hex.fromBytes(header.extraData),
				mixHash: Hex.fromBytes(header.mixHash),
				nonce: Hex.fromBytes(header.nonce),
				...(header.baseFeePerGas !== undefined && {
					baseFeePerGas: Hex.fromBigInt(header.baseFeePerGas),
				}),
				...(header.withdrawalsRoot !== undefined && {
					withdrawalsRoot: Hex.fromBytes(header.withdrawalsRoot),
				}),
				...(header.blobGasUsed !== undefined && {
					blobGasUsed: Hex.fromBigInt(header.blobGasUsed),
				}),
				...(header.excessBlobGas !== undefined && {
					excessBlobGas: Hex.fromBigInt(header.excessBlobGas),
				}),
				...(header.parentBeaconBlockRoot !== undefined && {
					parentBeaconBlockRoot: Hex.fromBytes(header.parentBeaconBlockRoot),
				}),
				// Body fields - transactions as unknown array (can be hashes or full objects)
				transactions: body.transactions as unknown[],
				...(body.ommers.length > 0 && {
					uncles: body.ommers as unknown[],
				}),
				...(body.withdrawals !== undefined && {
					withdrawals: body.withdrawals.map((w) => ({
						index: Hex.fromBigInt(w.index),
						validatorIndex: Hex.fromBigInt(w.validatorIndex),
						address: Hex.fromBytes(w.address),
						amount: Hex.fromBigInt(w.amount),
					})),
				}),
			};

			return ParseResult.succeed(rpc);
		} catch (e) {
			return ParseResult.fail(
				new ParseResult.Type(ast, block, (e as Error).message),
			);
		}
	},
}).annotations({ identifier: "Block.Rpc" });
