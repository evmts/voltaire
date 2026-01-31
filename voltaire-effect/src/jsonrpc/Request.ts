import * as Effect from "effect/Effect";
import { IdCounterService } from "./IdCounter.js";

export type JsonRpcIdType = number | string | null;

export type JsonRpcRequestType<TParams = unknown[]> = {
	readonly jsonrpc: "2.0";
	readonly method: string;
	readonly params?: TParams;
	readonly id?: JsonRpcIdType;
};

export function from(input: {
	method: string;
	params?: unknown[];
	id?: JsonRpcIdType;
}): JsonRpcRequestType {
	return {
		jsonrpc: "2.0",
		method: input.method,
		params: input.params,
		id: input.id,
	};
}

export function isNotification(request: JsonRpcRequestType): boolean {
	return request.id === undefined;
}

export function withParams<TParams>(
	request: JsonRpcRequestType,
): (
	params: TParams,
) => Effect.Effect<JsonRpcRequestType<TParams>, never, IdCounterService> {
	return (params: TParams) =>
		Effect.gen(function* () {
			const counter = yield* IdCounterService;
			const id = request.id ?? (yield* counter.next());
			return {
				jsonrpc: "2.0",
				method: request.method,
				params,
				id,
			};
		});
}

export const Request = {
	from,
	isNotification,
	withParams,
};
