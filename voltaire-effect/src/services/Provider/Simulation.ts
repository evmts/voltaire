/**
 * @fileoverview Live implementation of SimulationService using ProviderService.
 *
 * @module Simulation
 * @since 0.3.0
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { ProviderService } from "./ProviderService.js";
import { SimulationService } from "./SimulationService.js";

/**
 * Live implementation of the Simulation layer.
 *
 * @since 0.3.0
 */
export const Simulation: Layer.Layer<
	SimulationService,
	never,
	ProviderService
> = Layer.effect(
	SimulationService,
	Effect.gen(function* () {
		const provider = yield* ProviderService;
		return {
			call: provider.call,
			estimateGas: provider.estimateGas,
			createAccessList: provider.createAccessList,
			simulateV1: provider.simulateV1,
			simulateV2: provider.simulateV2,
		};
	}),
);
