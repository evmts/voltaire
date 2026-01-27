/**
 * @fileoverview Debug service definition for debug JSON-RPC methods.
 *
 * @module DebugService
 * @since 0.3.0
 */

import type { AddressInput } from "@tevm/voltaire/Address";
import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type { TransportError } from "../Transport/TransportError.js";
import type {
	BlockTag,
	CallRequest,
	HashInput,
	TransactionIndexInput,
} from "../Provider/ProviderService.js";

/**
 * Debug trace configuration object.
 *
 * @since 0.3.0
 */
export type DebugTraceConfig = Record<string, unknown>;

/**
 * Shape of the Debug service.
 *
 * @since 0.3.0
 */
export type DebugShape = {
	/** Traces a transaction by hash */
	readonly traceTransaction: (
		hash: HashInput,
		config?: DebugTraceConfig,
	) => Effect.Effect<unknown, TransportError>;
	/** Traces a call without sending a transaction */
	readonly traceCall: (
		tx: CallRequest,
		blockTag?: BlockTag,
		config?: DebugTraceConfig,
	) => Effect.Effect<unknown, TransportError>;
	/** Traces all transactions in a block by number/tag */
	readonly traceBlockByNumber: (
		blockTag: BlockTag | bigint,
		config?: DebugTraceConfig,
	) => Effect.Effect<unknown, TransportError>;
	/** Traces all transactions in a block by hash */
	readonly traceBlockByHash: (
		blockHash: HashInput,
		config?: DebugTraceConfig,
	) => Effect.Effect<unknown, TransportError>;
	/** Returns blocks that were rejected during block import */
	readonly getBadBlocks: () => Effect.Effect<unknown, TransportError>;
	/** Returns the raw RLP-encoded block */
	readonly getRawBlock: (
		blockId: BlockTag | HashInput | bigint,
	) => Effect.Effect<`0x${string}`, TransportError>;
	/** Returns the raw RLP-encoded block header */
	readonly getRawHeader: (
		blockId: BlockTag | HashInput | bigint,
	) => Effect.Effect<`0x${string}`, TransportError>;
	/** Returns raw receipts for the block */
	readonly getRawReceipts: (
		blockId: BlockTag | HashInput | bigint,
	) => Effect.Effect<`0x${string}`[], TransportError>;
	/** Returns the raw RLP-encoded transaction */
	readonly getRawTransaction: (
		hash: HashInput,
	) => Effect.Effect<`0x${string}`, TransportError>;
	/** Returns storage range at a given contract */
	readonly storageRangeAt: (
		blockHash: HashInput,
		txIndex: TransactionIndexInput,
		address: AddressInput,
		startKey: HashInput | `0x${string}`,
		maxResults: number,
	) => Effect.Effect<unknown, TransportError>;
};

/**
 * Debug service for debug JSON-RPC operations.
 *
 * @since 0.3.0
 */
export class DebugService extends Context.Tag("DebugService")<
	DebugService,
	DebugShape
>() {}
