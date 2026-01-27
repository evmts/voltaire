/**
 * @fileoverview Live implementation of StreamingService using ProviderService.
 *
 * @module Streaming
 * @since 0.3.0
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { ProviderService } from "./ProviderService.js";
import { StreamingService } from "./StreamingService.js";

/**
 * Live implementation of the Streaming layer.
 *
 * @since 0.3.0
 */
export const Streaming: Layer.Layer<
	StreamingService,
	never,
	ProviderService
> = Layer.effect(
	StreamingService,
	Effect.gen(function* () {
		const provider = yield* ProviderService;
		return {
			watchBlocks: provider.watchBlocks,
			backfillBlocks: provider.backfillBlocks,
			subscribe: provider.subscribe,
			unsubscribe: provider.unsubscribe,
		};
	}),
);
