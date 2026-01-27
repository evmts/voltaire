/**
 * @fileoverview Blocks service definition for block-related JSON-RPC calls.
 *
 * @module BlocksService
 * @since 0.3.0
 *
 * @description
 * The BlocksService provides block and uncle lookup operations split out of
 * ProviderService. This includes block numbers, block bodies, transaction counts,
 * and uncle retrieval/counts.
 *
 * @see {@link ProviderService} - Combined convenience service
 */

import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type {
	BlockType,
	GetBlockArgs,
	GetBlockError,
	GetBlockNumberError,
	GetBlockReceiptsArgs,
	GetBlockReceiptsError,
	GetBlockTransactionCountArgs,
	GetBlockTransactionCountError,
	GetUncleArgs,
	GetUncleCountArgs,
	GetUncleCountError,
	GetUncleError,
	ReceiptType,
	UncleBlockType,
} from "./ProviderService.js";

/**
 * Shape of the Blocks service.
 *
 * @since 0.3.0
 */
export type BlocksShape = {
	/** Gets the current block number */
	readonly getBlockNumber: () => Effect.Effect<bigint, GetBlockNumberError>;
	/** Gets a block by tag, hash, or number */
	readonly getBlock: (
		args?: GetBlockArgs,
	) => Effect.Effect<BlockType, GetBlockError>;
	/** Gets the transaction count in a block */
	readonly getBlockTransactionCount: (
		args: GetBlockTransactionCountArgs,
	) => Effect.Effect<bigint, GetBlockTransactionCountError>;
	/** Gets all receipts for a block (if supported by the node) */
	readonly getBlockReceipts?: (
		args?: GetBlockReceiptsArgs,
	) => Effect.Effect<ReceiptType[], GetBlockReceiptsError>;
	/** Gets an uncle block by block identifier and index */
	readonly getUncle: (
		args: GetUncleArgs,
		uncleIndex: `0x${string}`,
	) => Effect.Effect<UncleBlockType, GetUncleError>;
	/** Gets the number of uncles in a block (if supported by the node) */
	readonly getUncleCount?: (
		args: GetUncleCountArgs,
	) => Effect.Effect<bigint, GetUncleCountError>;
};

/**
 * Blocks service for block-related JSON-RPC operations.
 *
 * @since 0.3.0
 */
export class BlocksService extends Context.Tag("BlocksService")<
	BlocksService,
	BlocksShape
>() {}
