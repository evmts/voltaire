/**
 * @fileoverview Engine API service definition for consensus/execution JSON-RPC methods.
 *
 * @module EngineApiService
 * @since 0.3.0
 */

import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type { TransportError } from "../Transport/TransportError.js";

/**
 * Shape of the Engine API service.
 *
 * @since 0.3.0
 */
export type EngineApiShape = {
	/** Exchanges supported Engine API capabilities */
	readonly exchangeCapabilities: (
		capabilities: readonly string[],
	) => Effect.Effect<readonly string[], TransportError>;
	/** Exchanges transition configuration (V1) */
	readonly exchangeTransitionConfigurationV1: (
		config: unknown,
	) => Effect.Effect<unknown, TransportError>;
	/** Updates forkchoice (V1) */
	readonly forkchoiceUpdatedV1: (
		forkchoiceState: unknown,
		payloadAttributes?: unknown,
	) => Effect.Effect<unknown, TransportError>;
	/** Updates forkchoice (V2) */
	readonly forkchoiceUpdatedV2: (
		forkchoiceState: unknown,
		payloadAttributes?: unknown,
	) => Effect.Effect<unknown, TransportError>;
	/** Updates forkchoice (V3) */
	readonly forkchoiceUpdatedV3: (
		forkchoiceState: unknown,
		payloadAttributes?: unknown,
	) => Effect.Effect<unknown, TransportError>;
	/** Gets a payload by id (V1) */
	readonly getPayloadV1: (
		payloadId: `0x${string}`,
	) => Effect.Effect<unknown, TransportError>;
	/** Gets a payload by id (V2) */
	readonly getPayloadV2: (
		payloadId: `0x${string}`,
	) => Effect.Effect<unknown, TransportError>;
	/** Gets a payload by id (V3) */
	readonly getPayloadV3: (
		payloadId: `0x${string}`,
	) => Effect.Effect<unknown, TransportError>;
	/** Gets a payload by id (V4) */
	readonly getPayloadV4: (
		payloadId: `0x${string}`,
	) => Effect.Effect<unknown, TransportError>;
	/** Submits a new execution payload (V1) */
	readonly newPayloadV1: (
		payload: unknown,
	) => Effect.Effect<unknown, TransportError>;
	/** Submits a new execution payload (V2) */
	readonly newPayloadV2: (
		payload: unknown,
	) => Effect.Effect<unknown, TransportError>;
	/** Submits a new execution payload (V3) */
	readonly newPayloadV3: (
		payload: unknown,
		expectedBlobVersionedHashes?: readonly `0x${string}`[],
		parentBeaconBlockRoot?: `0x${string}`,
	) => Effect.Effect<unknown, TransportError>;
	/** Submits a new execution payload (V4) */
	readonly newPayloadV4: (
		payload: unknown,
		...extra: readonly unknown[]
	) => Effect.Effect<unknown, TransportError>;
	/** Gets payload bodies by block hash (V1) */
	readonly getPayloadBodiesByHashV1: (
		blockHashes: readonly `0x${string}`[],
	) => Effect.Effect<unknown, TransportError>;
	/** Gets payload bodies by range (V1) */
	readonly getPayloadBodiesByRangeV1: (
		start: `0x${string}` | number | bigint,
		count: `0x${string}` | number | bigint,
	) => Effect.Effect<unknown, TransportError>;
	/** Gets blobs by versioned hashes (V1) */
	readonly getBlobsV1: (
		versionedHashes: readonly `0x${string}`[],
	) => Effect.Effect<unknown, TransportError>;
};

/**
 * Engine API service for consensus/execution JSON-RPC operations.
 *
 * @since 0.3.0
 */
export class EngineApiService extends Context.Tag("EngineApiService")<
	EngineApiService,
	EngineApiShape
>() {}
