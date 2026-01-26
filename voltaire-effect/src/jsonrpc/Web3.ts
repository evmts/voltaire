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

export const ClientVersionRequest = () => makeRequest("web3_clientVersion");
export const Sha3Request = (data: string) => makeRequest("web3_sha3", [data]);

export const Web3 = {
	ClientVersionRequest,
	Sha3Request,
};
