import type { JsonRpcRequestType } from "./Request.js";

export type BatchRequestType = readonly JsonRpcRequestType[];

export function from(requests: JsonRpcRequestType[]): BatchRequestType {
	return requests;
}

export function add(
	batch: BatchRequestType,
): (request: JsonRpcRequestType) => BatchRequestType {
	return (request: JsonRpcRequestType) => [...batch, request];
}

export function size(batch: BatchRequestType): number {
	return batch.length;
}

export const BatchRequest = {
	from,
	add,
	size,
};
