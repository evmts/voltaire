import { nextId } from "./IdCounter.js";
import type { JsonRpcRequestType } from "./Request.js";

function makeRequest(
	method: string,
	params: unknown[] = [],
): JsonRpcRequestType {
	return {
		jsonrpc: "2.0",
		method,
		params,
		id: nextId(),
	};
}

export const SwitchEthereumChainRequest = (chainId: string) =>
	makeRequest("wallet_switchEthereumChain", [{ chainId }]);

export const AddEthereumChainRequest = (chainParams: {
	chainId: string;
	chainName: string;
	nativeCurrency?: { name: string; symbol: string; decimals: number };
	rpcUrls?: string[];
	blockExplorerUrls?: string[];
}) => makeRequest("wallet_addEthereumChain", [chainParams]);

export const WatchAssetRequest = (asset: {
	type: string;
	options: { address: string; symbol: string; decimals: number; image?: string };
}) => makeRequest("wallet_watchAsset", [asset]);

export const RequestPermissionsRequest = (permissions: unknown[]) =>
	makeRequest("wallet_requestPermissions", permissions);

export const GetPermissionsRequest = () =>
	makeRequest("wallet_getPermissions");

export const RevokePermissionsRequest = (permissions: unknown[]) =>
	makeRequest("wallet_revokePermissions", permissions);

export const Wallet = {
	SwitchEthereumChainRequest,
	AddEthereumChainRequest,
	WatchAssetRequest,
	RequestPermissionsRequest,
	GetPermissionsRequest,
	RevokePermissionsRequest,
};
