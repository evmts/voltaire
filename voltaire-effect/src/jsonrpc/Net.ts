import type { JsonRpcRequestType } from "./Request.js";

let idCounter = 3000;

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

export const VersionRequest = () => makeRequest("net_version");
export const ListeningRequest = () => makeRequest("net_listening");
export const PeerCountRequest = () => makeRequest("net_peerCount");

export const Net = {
	VersionRequest,
	ListeningRequest,
	PeerCountRequest,
};
