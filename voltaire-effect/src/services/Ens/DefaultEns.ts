/**
 * @fileoverview Live implementation of EnsService using ProviderService.
 *
 * @module DefaultEns
 * @since 0.0.1
 *
 * @description
 * Provides the live implementation layer for EnsService. This layer
 * delegates to the ENS helper functions and requires ProviderService
 * to be provided for RPC access.
 *
 * @see {@link EnsService} - The service interface
 * @see {@link ProviderService} - Required provider dependency
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { ProviderService } from "../Provider/ProviderService.js";
import { getEnsAddress } from "../Provider/ens/getEnsAddress.js";
import { getEnsAvatar } from "../Provider/ens/getEnsAvatar.js";
import { getEnsName } from "../Provider/ens/getEnsName.js";
import { getEnsResolver } from "../Provider/ens/getEnsResolver.js";
import { getEnsText } from "../Provider/ens/getEnsText.js";
import { EnsService } from "./EnsService.js";

/**
 * Live implementation of the ENS layer.
 *
 * @since 0.0.1
 */
export const DefaultEns: Layer.Layer<EnsService, never, ProviderService> =
	Layer.effect(
		EnsService,
		Effect.gen(function* () {
			const provider = yield* ProviderService;

			return {
				getEnsAddress: (params) =>
					getEnsAddress(params).pipe(
						Effect.provideService(ProviderService, provider),
					),
				getEnsName: (params) =>
					getEnsName(params).pipe(
						Effect.provideService(ProviderService, provider),
					),
				getEnsResolver: (params) =>
					getEnsResolver(params).pipe(
						Effect.provideService(ProviderService, provider),
					),
				getEnsAvatar: (params) =>
					getEnsAvatar(params).pipe(
						Effect.provideService(ProviderService, provider),
					),
				getEnsText: (params) =>
					getEnsText(params).pipe(
						Effect.provideService(ProviderService, provider),
					),
			};
		}),
	);
