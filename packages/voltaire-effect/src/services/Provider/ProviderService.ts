/**
 * @fileoverview Minimal Provider service for blockchain JSON-RPC operations.
 *
 * @module ProviderService
 * @since 0.0.1
 */

import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type { TransportError } from "../Transport/TransportError.js";

/**
 * Minimal provider shape - only the request method.
 * All operations are exposed as free functions that use this internally.
 */
export type ProviderShape = {
	readonly request: <T>(
		method: string,
		params?: unknown[],
	) => Effect.Effect<T, TransportError>;
};

/**
 * Provider service for blockchain JSON-RPC operations.
 * Use free functions (getBalance, getBlock, call, etc.) for operations.
 */
export class ProviderService extends Context.Tag("ProviderService")<
	ProviderService,
	ProviderShape
>() {}

// Re-export all types for convenience
export * from "./types.js";
