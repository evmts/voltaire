/**
 * @fileoverview Formatter service definition for blockchain data transformation.
 *
 * @module FormatterService
 * @since 0.0.1
 *
 * @description
 * The FormatterService provides an interface for transforming RPC data between
 * raw JSON-RPC format and application-friendly formats. This allows chains to
 * customize data formatting (e.g., Optimism's depositNonce, Arbitrum's L1 gas fields).
 *
 * The default implementation is a passthrough - chains can override with custom
 * formatters via Layer composition.
 *
 * @see {@link DefaultFormatter} - The default passthrough implementation
 */

import * as Context from "effect/Context";
import * as Data from "effect/Data";
import type * as Effect from "effect/Effect";

/**
 * Error thrown when data formatting fails.
 *
 * @description
 * Contains the original input, the type of data being formatted, and error details.
 *
 * @since 0.0.1
 *
 * @example Creating a FormatError
 * ```typescript
 * const error = new FormatError({
 *   input: invalidBlock,
 *   type: 'block',
 *   message: 'Missing required field: number'
 * })
 * ```
 *
 * @example Handling FormatError in Effect
 * ```typescript
 * import { Effect } from 'effect'
 * import { FormatterService, FormatError } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const formatter = yield* FormatterService
 *   return yield* formatter.formatBlock(rpcBlock)
 * }).pipe(
 *   Effect.catchTag('FormatError', (error) => {
 *     console.error('Format failed:', error.type, error.message)
 *     return Effect.succeed(null)
 *   })
 * )
 * ```
 */
export class FormatError extends Data.TaggedError("FormatError")<{
	/** The original input that failed to format */
	readonly input: unknown;
	/** The type of data being formatted */
	readonly type: "block" | "transaction" | "receipt" | "request";
	/** Human-readable error message */
	readonly message: string;
}> {}

/**
 * Shape of the formatter service.
 *
 * @description
 * Defines transformation methods for blockchain data types.
 * Each method takes raw RPC data and returns formatted data.
 *
 * @since 0.0.1
 */
export type FormatterShape = {
	/** Formats a block from RPC response */
	readonly formatBlock: (rpc: unknown) => Effect.Effect<unknown, FormatError>;
	/** Formats a transaction from RPC response */
	readonly formatTransaction: (
		rpc: unknown,
	) => Effect.Effect<unknown, FormatError>;
	/** Formats a transaction receipt from RPC response */
	readonly formatReceipt: (rpc: unknown) => Effect.Effect<unknown, FormatError>;
	/** Formats a transaction request for RPC submission */
	readonly formatRequest: (tx: unknown) => Effect.Effect<unknown, FormatError>;
};

/**
 * Formatter service for blockchain data transformation.
 *
 * @description
 * Provides methods for transforming blockchain data between RPC format and
 * application format. This is an Effect Context.Tag that must be provided
 * with a concrete implementation before running.
 *
 * The default implementation (DefaultFormatter) is a passthrough that returns
 * data unchanged. Chains can provide custom formatters for chain-specific fields:
 * - Optimism: depositNonce, depositNonceVersion, isSystemTx
 * - Arbitrum: gasUsedForL1, l1BlockNumber
 * - zkSync: l1BatchNumber, l1BatchTxIndex
 *
 * @since 0.0.1
 *
 * @example Using the formatter service
 * ```typescript
 * import { Effect } from 'effect'
 * import { FormatterService, DefaultFormatter } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const formatter = yield* FormatterService
 *   const block = yield* formatter.formatBlock(rpcBlock)
 *   const tx = yield* formatter.formatTransaction(rpcTx)
 *   return { block, tx }
 * }).pipe(Effect.provide(DefaultFormatter))
 * ```
 *
 * @example Custom chain formatter
 * ```typescript
 * import { Effect, Layer } from 'effect'
 * import { FormatterService, FormatError } from 'voltaire-effect/services'
 *
 * const OptimismFormatter = Layer.succeed(FormatterService, {
 *   formatBlock: (rpc) => Effect.succeed(rpc),
 *   formatTransaction: (rpc) => Effect.succeed({
 *     ...rpc,
 *     depositNonce: rpc.nonce // Optimism-specific field
 *   }),
 *   formatReceipt: (rpc) => Effect.succeed(rpc),
 *   formatRequest: (tx) => Effect.succeed(tx)
 * })
 * ```
 *
 * @see {@link DefaultFormatter} - The default passthrough implementation
 * @see {@link FormatError} - Error type for failed formatting
 */
export class FormatterService extends Context.Tag("FormatterService")<
	FormatterService,
	FormatterShape
>() {}
