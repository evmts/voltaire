import { nextId } from "./IdCounter.js";

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
): (params: TParams) => JsonRpcRequestType<TParams> {
	return (params: TParams) => ({
		jsonrpc: "2.0",
		method: request.method,
		params,
		id: request.id ?? nextId(),
	});
}

export const Request = {
	from,
	isNotification,
	withParams,
};
