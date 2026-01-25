import type { JsonRpcRequestType } from "./Request.js";

let idCounter = 4000;

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

export const ClientVersionRequest = () => makeRequest("web3_clientVersion");
export const Sha3Request = (data: string) => makeRequest("web3_sha3", [data]);

export const Web3 = {
	ClientVersionRequest,
	Sha3Request,
};
