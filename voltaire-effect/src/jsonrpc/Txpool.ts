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

export const StatusRequest = () => makeRequest("txpool_status");
export const ContentRequest = () => makeRequest("txpool_content");
export const InspectRequest = () => makeRequest("txpool_inspect");

export const Txpool = {
	StatusRequest,
	ContentRequest,
	InspectRequest,
};
