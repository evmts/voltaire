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

export const StatusRequest = () => makeRequest("txpool_status");
export const ContentRequest = () => makeRequest("txpool_content");
export const InspectRequest = () => makeRequest("txpool_inspect");

export const Txpool = {
	StatusRequest,
	ContentRequest,
	InspectRequest,
};
