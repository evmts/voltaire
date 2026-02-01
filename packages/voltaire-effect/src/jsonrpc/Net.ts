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

export const VersionRequest = () => makeRequest("net_version");
export const ListeningRequest = () => makeRequest("net_listening");
export const PeerCountRequest = () => makeRequest("net_peerCount");

export const Net = {
	VersionRequest,
	ListeningRequest,
	PeerCountRequest,
};
