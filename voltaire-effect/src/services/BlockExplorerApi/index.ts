/**
 * @fileoverview Block Explorer API module exports.
 *
 * @module BlockExplorerApi
 * @since 0.0.1
 */

// Types
export type {
	AbiItem,
	AbiResolution,
	BlockExplorerApiConfig,
	ContractSourceFile,
	ExplorerContractInstance,
	ExplorerSourceId,
	GetAbiOptions,
	GetContractOptions,
	GetSourcesOptions,
	ProxyInfo,
	ResolvedExplorerContract,
} from "./BlockExplorerApiTypes.js";

// Errors
export {
	BlockExplorerConfigError,
	BlockExplorerDecodeError,
	BlockExplorerNotFoundError,
	BlockExplorerProxyResolutionError,
	BlockExplorerRateLimitError,
	BlockExplorerResponseError,
	BlockExplorerUnexpectedError,
	type BlockExplorerApiError,
} from "./BlockExplorerApiErrors.js";

// Service
export {
	BlockExplorerApiService,
	type BlockExplorerApiShape,
} from "./BlockExplorerApiService.js";

// Layer factory
export { BlockExplorerApi } from "./BlockExplorerApi.js";
