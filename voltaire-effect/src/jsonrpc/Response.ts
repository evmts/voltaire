import * as Effect from "effect/Effect";
import type { JsonRpcErrorType } from "./Error.js";
import { JsonRpcErrorResponse, JsonRpcParseError } from "./errors.js";
import type { JsonRpcIdType } from "./Request.js";

export type JsonRpcSuccessResponseType<TResult = unknown> = {
	readonly jsonrpc: "2.0";
	readonly id: JsonRpcIdType;
	readonly result: TResult;
};

export type JsonRpcErrorResponseType = {
	readonly jsonrpc: "2.0";
	readonly id: JsonRpcIdType;
	readonly error: JsonRpcErrorType;
};

export type JsonRpcResponseType<TResult = unknown> =
	| JsonRpcSuccessResponseType<TResult>
	| JsonRpcErrorResponseType;

export function from<TResult = unknown>(
	raw: unknown,
): JsonRpcResponseType<TResult> {
	if (typeof raw !== "object" || raw === null) {
		throw new Error("Invalid JSON-RPC response: not an object");
	}
	const obj = raw as Record<string, unknown>;
	if (obj.jsonrpc !== "2.0") {
		throw new Error("Invalid JSON-RPC response: missing jsonrpc field");
	}
	return raw as JsonRpcResponseType<TResult>;
}

export function parse<TResult = unknown>(
	raw: unknown,
): Effect.Effect<JsonRpcResponseType<TResult>, JsonRpcParseError> {
	return Effect.try({
		try: () => from<TResult>(raw),
		catch: (error) =>
			new JsonRpcParseError(
				raw,
				error instanceof Error ? error.message : "Parse failed",
			),
	});
}

export function isSuccess<TResult>(
	response: JsonRpcResponseType<TResult>,
): response is JsonRpcSuccessResponseType<TResult> {
	return "result" in response;
}

export function isError<TResult>(
	response: JsonRpcResponseType<TResult>,
): response is JsonRpcErrorResponseType {
	return "error" in response;
}

export function unwrap<TResult>(
	response: JsonRpcResponseType<TResult>,
): Effect.Effect<TResult, JsonRpcErrorResponse> {
	if (isError(response)) {
		return Effect.fail(
			new JsonRpcErrorResponse({
				code: response.error.code,
				message: response.error.message,
				data: response.error.data,
			}),
		);
	}
	return Effect.succeed(response.result);
}

export const Response = {
	from,
	parse,
	isSuccess,
	isError,
	unwrap,
};
