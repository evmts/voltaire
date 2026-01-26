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

export const VersionRequest = () => makeRequest("net_version");
export const ListeningRequest = () => makeRequest("net_listening");
export const PeerCountRequest = () => makeRequest("net_peerCount");

export const Net = {
	VersionRequest,
	ListeningRequest,
	PeerCountRequest,
};
