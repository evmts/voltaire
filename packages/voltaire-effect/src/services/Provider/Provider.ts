/**
 * @fileoverview Live implementation of ProviderService.
 *
 * @module Provider
 * @since 0.0.1
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { TransportService } from "../Transport/TransportService.js";
import { ProviderService } from "./ProviderService.js";

/**
 * Live implementation layer for ProviderService.
 * Provides the minimal request method that all free functions use.
 * Requires TransportService to be provided.
 */
export const Provider = Layer.effect(
	ProviderService,
	Effect.gen(function* () {
		const transport = yield* TransportService;
		return {
			request: <T>(method: string, params?: unknown[]) =>
				transport.request<T>(method, params),
		};
	}),
);
