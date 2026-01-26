/**
 * @fileoverview Effect Schema for Ethereum block header from JSON-RPC format.
 * Provides bidirectional transformation between RPC hex-encoded format and BlockHeaderType.
 *
 * @module Rpc
 * @since 0.1.0
 */

import { BlockHeader } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import { BlockHeaderTypeSchema } from "./BlockHeaderSchema.js";

type BlockHeaderType = BlockHeader.BlockHeaderType;
type RpcBlockHeader = BlockHeader.RpcBlockHeader;

/**
 * Schema for RPC block header input format.
 * Validates the hex-encoded string format from JSON-RPC responses.
 *
 * @internal
 */
const RpcBlockHeaderSchema = S.Struct({
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
});

/**
 * Schema for BlockHeader from JSON-RPC response format.
 *
 * @description
 * Transforms RPC hex-encoded block header data to BlockHeaderType.
 * Decode converts hex strings to native types (bigint, Uint8Array, etc.).
 * Encode is not currently supported (would need toRpc implementation).
 *
 * @example Decoding
 * ```typescript
 * import * as BlockHeader from 'voltaire-effect/primitives/BlockHeader'
 * import * as S from 'effect/Schema'
 *
 * const rpcHeader = {
 *   parentHash: '0x...',
 *   sha3Uncles: '0x...',
 *   miner: '0x...',
 *   stateRoot: '0x...',
 *   // ... other fields
 * }
 * const header = S.decodeSync(BlockHeader.Rpc)(rpcHeader)
 * console.log(header.number) // bigint
 * ```
 *
 * @since 0.1.0
 */
export const Rpc: S.Schema<
	BlockHeaderType,
	S.Schema.Encoded<typeof RpcBlockHeaderSchema>
> = S.transformOrFail(RpcBlockHeaderSchema, BlockHeaderTypeSchema, {
	strict: true,
	decode: (rpc, _options, ast) => {
		try {
			return ParseResult.succeed(BlockHeader.fromRpc(rpc as RpcBlockHeader));
		} catch (e) {
			return ParseResult.fail(
				new ParseResult.Type(ast, rpc, (e as Error).message),
			);
		}
	},
	encode: (_header, _options, ast) => {
		return ParseResult.fail(
			new ParseResult.Type(
				ast,
				_header,
				"Encoding BlockHeader to RPC format is not yet supported",
			),
		);
	},
}).annotations({ identifier: "BlockHeader.Rpc" });
