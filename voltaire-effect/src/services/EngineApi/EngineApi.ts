/**
 * @fileoverview Live implementation of EngineApiService using TransportService.
 *
 * @module EngineApi
 * @since 0.3.0
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { TransportService } from "../Transport/TransportService.js";
import { EngineApiService } from "./EngineApiService.js";

const toQuantity = (value: `0x${string}` | number | bigint): `0x${string}` => {
	if (typeof value === "string") return value;
	const asBigInt = typeof value === "number" ? BigInt(value) : value;
	return `0x${asBigInt.toString(16)}` as `0x${string}`;
};

/**
 * Live implementation of the Engine API layer.
 *
 * @since 0.3.0
 */
export const EngineApi: Layer.Layer<EngineApiService, never, TransportService> =
	Layer.effect(
		EngineApiService,
		Effect.gen(function* () {
			const transport = yield* TransportService;
			const request = <T>(method: string, params?: unknown[]) =>
				transport.request<T>(method, params);

			return {
				exchangeCapabilities: (capabilities) =>
					request<readonly string[]>("engine_exchangeCapabilities", [
						capabilities,
					]),
				exchangeTransitionConfigurationV1: (config) =>
					request<unknown>("engine_exchangeTransitionConfigurationV1", [
						config,
					]),
				forkchoiceUpdatedV1: (forkchoiceState, payloadAttributes) =>
					request<unknown>("engine_forkchoiceUpdatedV1", [
						forkchoiceState,
						payloadAttributes ?? null,
					]),
				forkchoiceUpdatedV2: (forkchoiceState, payloadAttributes) =>
					request<unknown>("engine_forkchoiceUpdatedV2", [
						forkchoiceState,
						payloadAttributes ?? null,
					]),
				forkchoiceUpdatedV3: (forkchoiceState, payloadAttributes) =>
					request<unknown>("engine_forkchoiceUpdatedV3", [
						forkchoiceState,
						payloadAttributes ?? null,
					]),
				getPayloadV1: (payloadId) =>
					request<unknown>("engine_getPayloadV1", [payloadId]),
				getPayloadV2: (payloadId) =>
					request<unknown>("engine_getPayloadV2", [payloadId]),
				getPayloadV3: (payloadId) =>
					request<unknown>("engine_getPayloadV3", [payloadId]),
				getPayloadV4: (payloadId) =>
					request<unknown>("engine_getPayloadV4", [payloadId]),
				newPayloadV1: (payload) =>
					request<unknown>("engine_newPayloadV1", [payload]),
				newPayloadV2: (payload) =>
					request<unknown>("engine_newPayloadV2", [payload]),
				newPayloadV3: (
					payload,
					expectedBlobVersionedHashes,
					parentBeaconBlockRoot,
				) => {
					const params: unknown[] = [payload];
					if (expectedBlobVersionedHashes !== undefined) {
						params.push(expectedBlobVersionedHashes);
						if (parentBeaconBlockRoot !== undefined) {
							params.push(parentBeaconBlockRoot);
						}
					}
					return request<unknown>("engine_newPayloadV3", params);
				},
				newPayloadV4: (payload, ...extra) =>
					request<unknown>("engine_newPayloadV4", [payload, ...extra]),
				getPayloadBodiesByHashV1: (blockHashes) =>
					request<unknown>("engine_getPayloadBodiesByHashV1", [blockHashes]),
				getPayloadBodiesByRangeV1: (start, count) =>
					request<unknown>("engine_getPayloadBodiesByRangeV1", [
						toQuantity(start),
						toQuantity(count),
					]),
				getBlobsV1: (versionedHashes) =>
					request<unknown>("engine_getBlobsV1", [versionedHashes]),
			};
		}),
	);
