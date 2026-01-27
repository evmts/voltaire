/**
 * @fileoverview Simulation service definition for call and simulation JSON-RPC methods.
 *
 * @module SimulationService
 * @since 0.3.0
 */

import type { HexType } from "@tevm/voltaire/Hex";
import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type {
	AccessListType,
	BlockOverrides,
	BlockTag,
	CallError,
	CallRequest,
	CreateAccessListError,
	EstimateGasError,
	LogType,
	SimulateV1Error,
	SimulateV2Error,
	StateOverride,
} from "./ProviderService.js";

/**
 * Single block simulation input for eth_simulateV1.
 *
 * @since 0.3.0
 */
export interface SimulateV1BlockCall {
	/** Optional block overrides applied during the simulation */
	readonly blockOverrides?: BlockOverrides;
	/** Optional state overrides applied during the simulation */
	readonly stateOverrides?: StateOverride;
	/** Calls to execute within the block */
	readonly calls: readonly CallRequest[];
}

/**
 * Payload for eth_simulateV1.
 *
 * @since 0.3.0
 */
export interface SimulateV1Payload {
	/** Sequence of block simulations to execute */
	readonly blockStateCalls: readonly SimulateV1BlockCall[];
	/** Enable transfer tracing (if supported by node) */
	readonly traceTransfers?: boolean;
	/** Enable validation mode (if supported by node) */
	readonly validation?: boolean;
	/** Return full transaction objects (if supported) */
	readonly returnFullTransactions?: boolean;
}

/**
 * Call result from eth_simulateV1.
 *
 * @since 0.3.0
 */
export interface SimulateV1CallResult {
	/** Call execution status (0x1 success, 0x0 revert) */
	readonly status: `0x${string}`;
	/** Return data (hex) */
	readonly returnData: `0x${string}`;
	/** Gas used (hex) */
	readonly gasUsed: `0x${string}`;
	/** Logs emitted by the call */
	readonly logs?: LogType[];
	/** Optional error information */
	readonly error?: { code?: number; message?: string };
}

/**
 * Simulated block result from eth_simulateV1.
 *
 * @since 0.3.0
 */
export interface SimulateV1BlockResult {
	/** Base fee per gas (hex) */
	readonly baseFeePerGas?: `0x${string}`;
	/** Blob gas used (hex) */
	readonly blobGasUsed?: `0x${string}`;
	/** Calls executed in the block */
	readonly calls: SimulateV1CallResult[];
	/** Gas limit (hex) */
	readonly gasLimit?: `0x${string}`;
	/** Gas used (hex) */
	readonly gasUsed?: `0x${string}`;
	/** Simulated block hash */
	readonly hash?: `0x${string}`;
	/** Simulated block number (hex) */
	readonly number?: `0x${string}`;
	/** Simulated block timestamp (hex) */
	readonly timestamp?: `0x${string}`;
}

/**
 * Result type for eth_simulateV1.
 *
 * @since 0.3.0
 */
export type SimulateV1Result = SimulateV1BlockResult[];

/**
 * Payload for eth_simulateV2 (draft / evolving).
 *
 * @since 0.3.0
 */
export type SimulateV2Payload = Record<string, unknown>;

/**
 * Result type for eth_simulateV2 (draft / evolving).
 *
 * @since 0.3.0
 */
export type SimulateV2Result = unknown;

/**
 * Shape of the Simulation service.
 *
 * @since 0.3.0
 */
export type SimulationShape = {
	/** Executes a call without sending a transaction */
	readonly call: (
		tx: CallRequest,
		blockTag?: BlockTag,
		stateOverride?: StateOverride,
		blockOverrides?: BlockOverrides,
	) => Effect.Effect<HexType | `0x${string}`, CallError>;
	/** Estimates gas for a transaction */
	readonly estimateGas: (
		tx: CallRequest,
		blockTag?: BlockTag,
		stateOverride?: StateOverride,
	) => Effect.Effect<bigint, EstimateGasError>;
	/** Creates an access list for a transaction */
	readonly createAccessList: (
		tx: CallRequest,
	) => Effect.Effect<AccessListType, CreateAccessListError>;
	/** Simulates multiple blocks and calls (if supported) */
	readonly simulateV1?: (
		payload: SimulateV1Payload,
		blockTag?: BlockTag,
	) => Effect.Effect<SimulateV1Result, SimulateV1Error>;
	/** Simulates with the V2 API (draft / evolving, if supported) */
	readonly simulateV2?: <TResult = SimulateV2Result>(
		payload: SimulateV2Payload,
		blockTag?: BlockTag,
	) => Effect.Effect<TResult, SimulateV2Error>;
};

/**
 * Simulation service for call/simulation JSON-RPC operations.
 *
 * @since 0.3.0
 */
export class SimulationService extends Context.Tag("SimulationService")<
	SimulationService,
	SimulationShape
>() {}
