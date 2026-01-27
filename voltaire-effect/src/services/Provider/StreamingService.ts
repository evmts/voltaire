/**
 * @fileoverview Streaming service definition for streaming JSON-RPC calls.
 *
 * @module StreamingService
 * @since 0.3.0
 */

import type {
	BackfillOptions,
	BlockInclude,
	BlockStreamEvent,
	BlocksEvent,
	WatchOptions,
} from "@tevm/voltaire/block";
import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type * as Stream from "effect/Stream";
import type {
	BackfillBlocksError,
	SubscribeError,
	UnsubscribeError,
	WatchBlocksError,
} from "./ProviderService.js";

/**
 * Shape of the Streaming service.
 *
 * @since 0.3.0
 */
export type StreamingShape = {
	/** Watch for new blocks with reorg detection */
	readonly watchBlocks: <TInclude extends BlockInclude = "header">(
		options?: WatchOptions<TInclude>,
	) => Stream.Stream<BlockStreamEvent<TInclude>, WatchBlocksError>;
	/** Backfill historical blocks */
	readonly backfillBlocks: <TInclude extends BlockInclude = "header">(
		options: BackfillOptions<TInclude>,
	) => Stream.Stream<BlocksEvent<TInclude>, BackfillBlocksError>;
	/** Subscribes to JSON-RPC streams (eth_subscribe) */
	readonly subscribe?: (
		subscription: string,
		params?: readonly unknown[],
	) => Effect.Effect<`0x${string}`, SubscribeError>;
	/** Unsubscribes from JSON-RPC streams (eth_unsubscribe) */
	readonly unsubscribe?: (
		subscriptionId: `0x${string}`,
	) => Effect.Effect<boolean, UnsubscribeError>;
};

/**
 * Streaming service for block streams and subscriptions.
 *
 * @since 0.3.0
 */
export class StreamingService extends Context.Tag("StreamingService")<
	StreamingService,
	StreamingShape
>() {}
