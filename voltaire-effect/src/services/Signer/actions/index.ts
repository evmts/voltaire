/**
 * @fileoverview Signer action exports.
 *
 * @module Signer/actions
 * @since 0.0.1
 */

export {
	type Abi as DeployContractAbi,
	type DeployContractParams,
	type DeployContractResult,
	deployContract,
} from "./deployContract.js";
export {
	type Abi as WriteContractAbi,
	type WriteContractParams,
	writeContract,
} from "./writeContract.js";

// Wallet management actions (EIP-3085, EIP-747, EIP-2255)
export { addChain, type Chain, type NativeCurrency } from "./addChain.js";
export { switchChain } from "./switchChain.js";
export {
	watchAsset,
	type WatchAssetParams,
	type WatchAssetOptions,
	type WatchAssetType,
} from "./watchAsset.js";
export {
	getPermissions,
	type Permission,
	type Caveat,
} from "./getPermissions.js";
export {
	requestPermissions,
	type PermissionRequest,
} from "./requestPermissions.js";
export { getAddresses } from "./getAddresses.js";

// EIP-7702 Authorization actions
export {
	prepareAuthorization,
	type PrepareAuthorizationParams,
	type Authorization,
} from "./prepareAuthorization.js";
export {
	signAuthorization,
	type SignAuthorizationParams,
	type SignedAuthorization,
} from "./signAuthorization.js";
