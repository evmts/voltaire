/**
 * @fileoverview Block Explorer API error definitions.
 *
 * @module BlockExplorerApiErrors
 * @since 0.0.1
 *
 * @description
 * Strongly typed error classes for Block Explorer API operations.
 * All errors are compatible with Effect.catchTag for type-safe error handling.
 */

import * as Data from "effect/Data";
import type { ExplorerSourceId } from "./BlockExplorerApiTypes.js";

/**
 * Error thrown when configuration is invalid.
 * @since 0.0.1
 */
export class BlockExplorerConfigError extends Data.TaggedError(
	"BlockExplorerConfigError",
)<{
	readonly message: string;
}> {
	constructor(message: string) {
		super({ message });
	}
}

/**
 * Error thrown when no ABI is found from any configured source.
 * @since 0.0.1
 */
export class BlockExplorerNotFoundError extends Data.TaggedError(
	"BlockExplorerNotFoundError",
)<{
	readonly address: `0x${string}`;
	readonly attemptedSources: ReadonlyArray<string>;
	readonly message: string;
}> {
	constructor(
		address: `0x${string}`,
		attemptedSources: ReadonlyArray<string>,
	) {
		super({
			address,
			attemptedSources,
			message: `No ABI found for ${address}. Attempted sources: ${attemptedSources.join(", ")}`,
		});
	}
}

/**
 * Error thrown when rate limited by a block explorer source.
 * @since 0.0.1
 */
export class BlockExplorerRateLimitError extends Data.TaggedError(
	"BlockExplorerRateLimitError",
)<{
	readonly source: ExplorerSourceId;
	readonly address: `0x${string}`;
	readonly message: string;
	readonly retryAfterSeconds?: number;
}> {
	constructor(
		source: ExplorerSourceId,
		address: `0x${string}`,
		message: string,
		retryAfterSeconds?: number,
	) {
		super({ source, address, message, retryAfterSeconds });
	}
}

/**
 * Error thrown when a block explorer returns a non-200 response or network error.
 * @since 0.0.1
 */
export class BlockExplorerResponseError extends Data.TaggedError(
	"BlockExplorerResponseError",
)<{
	readonly source: ExplorerSourceId;
	readonly address: `0x${string}`;
	readonly status?: number;
	readonly message: string;
	readonly body?: string;
}> {
	constructor(
		source: ExplorerSourceId,
		address: `0x${string}`,
		message: string,
		options?: { status?: number; body?: string },
	) {
		super({
			source,
			address,
			message,
			status: options?.status,
			body: options?.body,
		});
	}
}

/**
 * Error thrown when a block explorer response cannot be decoded.
 * @since 0.0.1
 */
export class BlockExplorerDecodeError extends Data.TaggedError(
	"BlockExplorerDecodeError",
)<{
	readonly source: ExplorerSourceId;
	readonly address: `0x${string}`;
	readonly message: string;
	readonly bodySnippet?: string;
}> {
	constructor(
		source: ExplorerSourceId,
		address: `0x${string}`,
		message: string,
		bodySnippet?: string,
	) {
		super({ source, address, message, bodySnippet });
	}
}

/**
 * Error thrown when proxy resolution fails.
 * @since 0.0.1
 */
export class BlockExplorerProxyResolutionError extends Data.TaggedError(
	"BlockExplorerProxyResolutionError",
)<{
	readonly address: `0x${string}`;
	readonly message: string;
}> {
	constructor(address: `0x${string}`, message: string) {
		super({ address, message });
	}
}

/**
 * Catch-all error for unexpected failures.
 * @since 0.0.1
 */
export class BlockExplorerUnexpectedError extends Data.TaggedError(
	"BlockExplorerUnexpectedError",
)<{
	readonly phase:
		| "getAbi"
		| "getContract"
		| "getSources"
		| "followProxies"
		| "bestEffortRecovery";
	readonly message: string;
	readonly cause: unknown;
}> {
	constructor(
		phase: BlockExplorerUnexpectedError["phase"],
		message: string,
		cause: unknown,
	) {
		super({ phase, message, cause });
	}
}

/**
 * Union of all Block Explorer API errors.
 * @since 0.0.1
 */
export type BlockExplorerApiError =
	| BlockExplorerConfigError
	| BlockExplorerNotFoundError
	| BlockExplorerRateLimitError
	| BlockExplorerResponseError
	| BlockExplorerDecodeError
	| BlockExplorerProxyResolutionError
	| BlockExplorerUnexpectedError;
