/**
 * @fileoverview Default formatter implementation (identity transform).
 *
 * @module DefaultFormatter
 * @since 0.0.1
 *
 * @description
 * Provides a default passthrough implementation of the FormatterService.
 * All data is returned unchanged, allowing chains to override with custom
 * formatting when needed.
 *
 * @see {@link FormatterService} - The service interface
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { FormatterService } from "./FormatterService.js";

/**
 * Default formatter layer that passes data through unchanged.
 *
 * @description
 * This is a passthrough implementation where all format methods return
 * the input unchanged. Chains can override this layer with custom
 * formatters for chain-specific fields.
 *
 * Use cases for overriding:
 * - Optimism: Add depositNonce, isSystemTx fields
 * - Arbitrum: Add gasUsedForL1, l1BlockNumber fields
 * - zkSync: Add l1BatchNumber, l1BatchTxIndex fields
 * - Base: Inherit from Optimism formatter
 *
 * @since 0.0.1
 *
 * @example Using the default formatter
 * ```typescript
 * import { Effect } from 'effect'
 * import { FormatterService, DefaultFormatter } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const formatter = yield* FormatterService
 *   const block = yield* formatter.formatBlock(rpcBlock)
 *   return block // unchanged from rpcBlock
 * }).pipe(Effect.provide(DefaultFormatter))
 * ```
 *
 * @example Overriding with a custom formatter
 * ```typescript
 * import { Effect, Layer } from 'effect'
 * import { FormatterService } from 'voltaire-effect'
 *
 * const MyChainFormatter = Layer.succeed(FormatterService, {
 *   formatBlock: (rpc) => Effect.succeed({
 *     ...rpc,
 *     customField: extractCustomField(rpc)
 *   }),
 *   formatTransaction: (rpc) => Effect.succeed(rpc),
 *   formatReceipt: (rpc) => Effect.succeed(rpc),
 *   formatRequest: (tx) => Effect.succeed(tx)
 * })
 *
 * // Use MyChainFormatter instead of DefaultFormatter
 * const program = myEffect.pipe(Effect.provide(MyChainFormatter))
 * ```
 */
export const DefaultFormatter: Layer.Layer<FormatterService> = Layer.succeed(
	FormatterService,
	{
		formatBlock: (rpc: unknown) => Effect.succeed(rpc),
		formatTransaction: (rpc: unknown) => Effect.succeed(rpc),
		formatReceipt: (rpc: unknown) => Effect.succeed(rpc),
		formatRequest: (tx: unknown) => Effect.succeed(tx),
	},
);
