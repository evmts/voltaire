import type { JsonRpcRequestType } from "./Request.js";

let idCounter = 7000;

function makeRequest(
	method: string,
	params: unknown[] = [],
): JsonRpcRequestType {
	return {
		jsonrpc: "2.0",
		method,
		params,
		id: ++idCounter,
	};
}

export const ResetRequest = (options?: { forking?: { jsonRpcUrl: string; blockNumber?: number } }) =>
	makeRequest("hardhat_reset", options ? [options] : []);
export const SetBalanceRequest = (address: string, balance: string) =>
	makeRequest("hardhat_setBalance", [address, balance]);
export const SetCodeRequest = (address: string, code: string) =>
	makeRequest("hardhat_setCode", [address, code]);
export const SetNonceRequest = (address: string, nonce: string) =>
	makeRequest("hardhat_setNonce", [address, nonce]);
export const SetStorageAtRequest = (
	address: string,
	slot: string,
	value: string,
) => makeRequest("hardhat_setStorageAt", [address, slot, value]);
export const ImpersonateAccountRequest = (address: string) =>
	makeRequest("hardhat_impersonateAccount", [address]);
export const StopImpersonatingAccountRequest = (address: string) =>
	makeRequest("hardhat_stopImpersonatingAccount", [address]);
export const MineRequest = (blocks?: number, interval?: number) =>
	makeRequest("hardhat_mine", blocks ? [`0x${blocks.toString(16)}`, interval ? `0x${interval.toString(16)}` : undefined] : []);
export const DropTransactionRequest = (hash: string) =>
	makeRequest("hardhat_dropTransaction", [hash]);
export const SetCoinbaseRequest = (address: string) =>
	makeRequest("hardhat_setCoinbase", [address]);
export const SetMinGasPriceRequest = (gasPrice: string) =>
	makeRequest("hardhat_setMinGasPrice", [gasPrice]);
export const SetNextBlockBaseFeePerGasRequest = (baseFee: string) =>
	makeRequest("hardhat_setNextBlockBaseFeePerGas", [baseFee]);
export const SetPrevRandaoRequest = (prevRandao: string) =>
	makeRequest("hardhat_setPrevRandao", [prevRandao]);

export const Hardhat = {
	ResetRequest,
	SetBalanceRequest,
	SetCodeRequest,
	SetNonceRequest,
	SetStorageAtRequest,
	ImpersonateAccountRequest,
	StopImpersonatingAccountRequest,
	MineRequest,
	DropTransactionRequest,
	SetCoinbaseRequest,
	SetMinGasPriceRequest,
	SetNextBlockBaseFeePerGasRequest,
	SetPrevRandaoRequest,
};
