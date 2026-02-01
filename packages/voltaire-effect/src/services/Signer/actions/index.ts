/**
 * @fileoverview Signer action exports.
 *
 * @module Signer/actions
 * @since 0.0.1
 */

export type {
	Authorization,
	UnsignedAuthorization,
} from "../../Account/index.js";
export type { PrepareAuthorizationParams } from "../SignerService.js";
// Wallet management actions (EIP-3085, EIP-747, EIP-2255)
export { addChain, type ChainConfig, type NativeCurrency } from "./addChain.js";
export {
	type Abi as DeployContractAbi,
	type DeployContractParams,
	type DeployContractResult,
	deployContract,
} from "./deployContract.js";
export { getAddresses } from "./getAddresses.js";
export {
	type Caveat,
	getPermissions,
	type Permission,
} from "./getPermissions.js";
// EIP-7702 Authorization actions
export { prepareAuthorization } from "./prepareAuthorization.js";
export {
	type PermissionRequest,
	requestPermissions,
} from "./requestPermissions.js";
export {
	type SignAuthorizationParams,
	type SignedAuthorization,
	signAuthorization,
} from "./signAuthorization.js";
export { switchChain } from "./switchChain.js";
export {
	type WatchAssetOptions,
	type WatchAssetParams,
	type WatchAssetType,
	watchAsset,
} from "./watchAsset.js";
export {
	type Abi as WriteContractAbi,
	type WriteContractParams,
	writeContract,
} from "./writeContract.js";
