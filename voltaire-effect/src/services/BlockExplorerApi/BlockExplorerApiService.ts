/**
 * @fileoverview Block Explorer API service definition.
 *
 * @module BlockExplorerApiService
 * @since 0.0.1
 *
 * @description
 * The BlockExplorerApiService provides typed access to block explorer APIs
 * for resolving contract ABIs, metadata, and source code.
 */

import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type {
	AbiItem,
	ContractSourceFile,
	ExplorerContractInstance,
	GetAbiOptions,
	GetContractOptions,
	GetSourcesOptions,
} from "./BlockExplorerApiTypes.js";
import type { BlockExplorerApiError } from "./BlockExplorerApiErrors.js";

/**
 * Service interface for Block Explorer API operations.
 * @since 0.0.1
 */
export interface BlockExplorerApiShape {
	/**
	 * Fetch contract with callable read/write methods.
	 */
	readonly getContract: (
		address: `0x${string}`,
		options?: GetContractOptions,
	) => Effect.Effect<ExplorerContractInstance, BlockExplorerApiError>;

	/**
	 * Convenience wrapper for getContract(...).abi
	 */
	readonly getAbi: (
		address: `0x${string}`,
		options?: GetAbiOptions,
	) => Effect.Effect<ReadonlyArray<AbiItem>, BlockExplorerApiError>;

	/**
	 * Convenience wrapper for getContract(...).sources
	 */
	readonly getSources: (
		address: `0x${string}`,
		options?: GetSourcesOptions,
	) => Effect.Effect<ReadonlyArray<ContractSourceFile>, BlockExplorerApiError>;
}

/**
 * Block Explorer API service for resolving contract ABIs and metadata.
 * @since 0.0.1
 */
export class BlockExplorerApiService extends Context.Tag(
	"BlockExplorerApiService",
)<BlockExplorerApiService, BlockExplorerApiShape>() {}
