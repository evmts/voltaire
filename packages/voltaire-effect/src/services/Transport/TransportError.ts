/**
 * @fileoverview Transport error class for JSON-RPC communication failures.
 *
 * @module TransportError
 * @since 0.0.1
 *
 * @description
 * Defines the error type used by all transport implementations when JSON-RPC
 * communication fails. The error includes the JSON-RPC error code, message,
 * and optional additional data for debugging.
 *
 * Common JSON-RPC error codes:
 * - -32700: Parse error
 * - -32600: Invalid request
 * - -32601: Method not found
 * - -32602: Invalid params
 * - -32603: Internal error
 * - -32000 to -32099: Server errors (implementation-defined)
 *
 * @see {@link TransportService} - The service that uses this error type
 */

import * as Data from "effect/Data";

/**
 * Error thrown when a transport operation fails.
 *
 * @description
 * Contains JSON-RPC error code and optional data for debugging.
 * This error is thrown by all transport implementations (HttpTransport,
 * WebSocketTransport, BrowserTransport) when a JSON-RPC request fails.
 *
 * The error includes:
 * - `code`: Standard JSON-RPC error code
 * - `message`: Human-readable error description
 * - `data`: Optional additional error data from the provider
 *
 * @since 0.0.1
 *
 * @example Creating a transport error
 * ```typescript
 * const error = new TransportError({
 *   code: -32603,
 *   message: 'Internal error',
 *   data: { details: 'Connection refused' }
 * })
 *
 * console.log(error.code)    // -32603
 * console.log(error.message) // 'Internal error'
 * console.log(error.data)    // { details: 'Connection refused' }
 * ```
 *
 * @example Handling transport errors in Effect
 * ```typescript
 * import { Effect } from 'effect'
 * import { TransportService, TransportError, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const transport = yield* TransportService
 *   return yield* transport.request<string>('eth_blockNumber')
 * }).pipe(
 *   Effect.catchTag('TransportError', (error) => {
 *     if (error.code === -32601) {
 *       console.log('Method not supported by this node')
 *     }
 *     return Effect.fail(error)
 *   }),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 *
 * @see {@link TransportService} - The service that produces this error
 */
export class TransportError extends Data.TaggedError("TransportError")<{
	/**
	 * The original input that caused the error.
	 */
	readonly input: { code: number; message: string; data?: unknown };

	/**
	 * JSON-RPC error code.
	 */
	readonly code: number;

	/**
	 * Human-readable error message.
	 */
	readonly message: string;

	/**
	 * Additional error data from the JSON-RPC response.
	 *
	 * @description
	 * May contain provider-specific error details such as revert reasons,
	 * stack traces, or other debugging information.
	 */
	readonly data?: unknown;

	/**
	 * Optional underlying cause.
	 */
	readonly cause?: unknown;

	/**
	 * Optional context for debugging.
	 */
	readonly context?: Record<string, unknown>;
}> {
	/**
	 * Creates a new TransportError.
	 *
	 * @param input - JSON-RPC error response containing code, message, and optional data
	 * @param message - Optional override for the error message
	 * @param options - Optional error options
	 * @param options.cause - Underlying error that caused this failure
	 */
	constructor(
		input: { code: number; message: string; data?: unknown },
		message?: string,
		options?: {
			cause?: unknown;
			context?: Record<string, unknown>;
		},
	) {
		super({
			input,
			code: input.code,
			message: message ?? input.message,
			data: input.data,
			cause: options?.cause,
			context: options?.context,
		});
	}
}
