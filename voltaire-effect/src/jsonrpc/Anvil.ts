import * as Effect from "effect/Effect";
import { IdCounterService } from "./IdCounter.js";
import type { JsonRpcRequestType } from "./Request.js";

function makeRequest(
	method: string,
	params: unknown[] = [],
): Effect.Effect<JsonRpcRequestType, never, IdCounterService> {
	return Effect.gen(function* () {
		const counter = yield* IdCounterService;
		const id = yield* counter.next();
		return {
			jsonrpc: "2.0",
			method,
			params,
			id,
		};
	});
}

export const MineRequest = (blocks?: number, interval?: number) =>
	makeRequest("anvil_mine", blocks ? [blocks, interval] : []);
export const SetBalanceRequest = (address: string, balance: string) =>
	makeRequest("anvil_setBalance", [address, balance]);
export const SetCodeRequest = (address: string, code: string) =>
	makeRequest("anvil_setCode", [address, code]);
export const SetNonceRequest = (address: string, nonce: string) =>
	makeRequest("anvil_setNonce", [address, nonce]);
export const SetStorageAtRequest = (
	address: string,
	slot: string,
	value: string,
) => makeRequest("anvil_setStorageAt", [address, slot, value]);
export const ImpersonateAccountRequest = (address: string) =>
	makeRequest("anvil_impersonateAccount", [address]);
export const StopImpersonatingAccountRequest = (address: string) =>
	makeRequest("anvil_stopImpersonatingAccount", [address]);
export const ResetRequest = (options?: {
	forking?: { jsonRpcUrl: string; blockNumber?: number };
}) => makeRequest("anvil_reset", options ? [options] : []);
export const SetRpcUrlRequest = (url: string) =>
	makeRequest("anvil_setRpcUrl", [url]);
export const SetCoinbaseRequest = (address: string) =>
	makeRequest("anvil_setCoinbase", [address]);
export const DumpStateRequest = () => makeRequest("anvil_dumpState");
export const LoadStateRequest = (state: string) =>
	makeRequest("anvil_loadState", [state]);
export const SnapshotRequest = () => makeRequest("evm_snapshot");
export const RevertRequest = (snapshotId: string) =>
	makeRequest("evm_revert", [snapshotId]);
export const IncreaseTimeRequest = (seconds: number) =>
	makeRequest("evm_increaseTime", [seconds]);
export const SetNextBlockTimestampRequest = (timestamp: number) =>
	makeRequest("evm_setNextBlockTimestamp", [timestamp]);
export const SetBlockGasLimitRequest = (gasLimit: string) =>
	makeRequest("evm_setBlockGasLimit", [gasLimit]);
export const SetMinGasPriceRequest = (gasPrice: string) =>
	makeRequest("anvil_setMinGasPrice", [gasPrice]);
export const DropTransactionRequest = (hash: string) =>
	makeRequest("anvil_dropTransaction", [hash]);
export const GetAutomineRequest = () => makeRequest("anvil_getAutomine");
export const SetAutomineRequest = (enabled: boolean) =>
	makeRequest("evm_setAutomine", [enabled]);
export const SetIntervalMiningRequest = (interval: number) =>
	makeRequest("evm_setIntervalMining", [interval]);
export const EnableTracesRequest = () => makeRequest("anvil_enableTraces");

export const Anvil = {
	MineRequest,
	SetBalanceRequest,
	SetCodeRequest,
	SetNonceRequest,
	SetStorageAtRequest,
	ImpersonateAccountRequest,
	StopImpersonatingAccountRequest,
	ResetRequest,
	SetRpcUrlRequest,
	SetCoinbaseRequest,
	DumpStateRequest,
	LoadStateRequest,
	SnapshotRequest,
	RevertRequest,
	IncreaseTimeRequest,
	SetNextBlockTimestampRequest,
	SetBlockGasLimitRequest,
	SetMinGasPriceRequest,
	DropTransactionRequest,
	GetAutomineRequest,
	SetAutomineRequest,
	SetIntervalMiningRequest,
	EnableTracesRequest,
};
