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

export const ClientVersionRequest = () => makeRequest("web3_clientVersion");
export const Sha3Request = (data: string) => makeRequest("web3_sha3", [data]);

export const Web3 = {
	ClientVersionRequest,
	Sha3Request,
};
