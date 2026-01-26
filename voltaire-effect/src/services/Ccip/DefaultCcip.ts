/**
 * @fileoverview Default CCIP implementation using HTTP fetch.
 *
 * @module DefaultCcip
 * @since 0.0.1
 *
 * @description
 * Implements EIP-3668 CCIP requests by fetching data from offchain gateway URLs.
 * URLs are tried in order until one succeeds.
 *
 * URL format per EIP-3668:
 * - Replace {sender} with the contract address (lowercase)
 * - Replace {data} with the calldata
 * - If URL contains {data}, use GET request
 * - Otherwise use POST with JSON body { sender, data }
 *
 * @see {@link CcipService} - The service interface
 * @see {@link NoopCcip} - Disabled implementation
 * @see https://eips.ethereum.org/EIPS/eip-3668
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { CcipError, type CcipRequest, CcipService } from "./CcipService.js";

/**
 * Checks if a string is valid hex data.
 */
const isHex = (value: unknown): value is `0x${string}` => {
	if (typeof value !== "string") return false;
	if (!value.startsWith("0x")) return false;
	return /^0x[0-9a-fA-F]*$/.test(value);
};

/**
 * Makes a single CCIP request to a gateway URL.
 */
const makeRequest = (
	url: string,
	sender: `0x${string}`,
	callData: `0x${string}`,
): Effect.Effect<`0x${string}`, CcipError> =>
	Effect.gen(function* () {
		const method = url.includes("{data}") ? "GET" : "POST";
		const resolvedUrl = url
			.replace("{sender}", sender.toLowerCase())
			.replace("{data}", callData);

		const body =
			method === "POST"
				? JSON.stringify({ sender, data: callData })
				: undefined;
		const headers: HeadersInit =
			method === "POST" ? { "Content-Type": "application/json" } : {};

		const response = yield* Effect.tryPromise({
			try: () =>
				fetch(resolvedUrl, {
					method,
					headers,
					body,
				}),
			catch: (error) =>
				new CcipError({
					urls: [url],
					message: `Fetch failed: ${error instanceof Error ? error.message : String(error)}`,
					cause: error,
				}),
		});

		if (!response.ok) {
			const text = yield* Effect.tryPromise({
				try: () => response.text(),
				catch: () =>
					new CcipError({
						urls: [url],
						message: `HTTP ${response.status}: ${response.statusText}`,
					}),
			});
			return yield* Effect.fail(
				new CcipError({
					urls: [url],
					message: `HTTP ${response.status}: ${text || response.statusText}`,
				}),
			);
		}

		const contentType = response.headers.get("Content-Type") ?? "";
		let result: unknown;

		if (contentType.startsWith("application/json")) {
			const json = yield* Effect.tryPromise({
				try: () => response.json() as Promise<{ data?: unknown }>,
				catch: (error) =>
					new CcipError({
						urls: [url],
						message: `JSON parse failed: ${error instanceof Error ? error.message : String(error)}`,
						cause: error,
					}),
			});
			result = json.data;
		} else {
			result = yield* Effect.tryPromise({
				try: () => response.text(),
				catch: (error) =>
					new CcipError({
						urls: [url],
						message: `Text read failed: ${error instanceof Error ? error.message : String(error)}`,
						cause: error,
					}),
			});
		}

		if (!isHex(result)) {
			return yield* Effect.fail(
				new CcipError({
					urls: [url],
					message: `Response is not valid hex: ${String(result)}`,
				}),
			);
		}

		return result;
	});

/**
 * Default CCIP implementation layer.
 *
 * @description
 * Provides CcipService with an HTTP-based implementation that follows EIP-3668.
 * Tries each URL in order until one succeeds.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { CcipService, DefaultCcip } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const ccip = yield* CcipService
 *   return yield* ccip.request({
 *     sender: '0x123...',
 *     urls: ['https://gateway.example.com/{sender}/{data}'],
 *     callData: '0xabc...',
 *     callbackSelector: '0x12345678',
 *     extraData: '0x'
 *   })
 * }).pipe(Effect.provide(DefaultCcip))
 * ```
 */
export const DefaultCcip: Layer.Layer<CcipService> = Layer.succeed(
	CcipService,
	CcipService.of({
		request: (params: CcipRequest) =>
			Effect.gen(function* () {
				const { sender, urls, callData } = params;

				if (urls.length === 0) {
					return yield* Effect.fail(
						new CcipError({
							urls: [],
							message: "No URLs provided for CCIP lookup",
						}),
					);
				}

				let lastError: CcipError | undefined;

				for (const url of urls) {
					const result = yield* Effect.either(
						makeRequest(url, sender, callData),
					);
					if (result._tag === "Right") {
						return result.right;
					}
					lastError = result.left;
				}

				return yield* Effect.fail(
					lastError ??
						new CcipError({
							urls: [...urls],
							message: "All CCIP gateway URLs failed",
						}),
				);
			}),
	}),
);
