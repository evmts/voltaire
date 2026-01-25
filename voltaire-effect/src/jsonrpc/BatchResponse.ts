import * as Effect from "effect/Effect";
import { JsonRpcParseError } from "./errors.js";
import type { JsonRpcIdType } from "./Request.js";
import {
	isError,
	type JsonRpcErrorResponseType,
	type JsonRpcResponseType,
} from "./Response.js";

export type BatchResponseType = readonly JsonRpcResponseType[];

export function from(raw: unknown[]): BatchResponseType {
	return raw as BatchResponseType;
}

export function parse(
	raw: unknown,
): Effect.Effect<BatchResponseType, JsonRpcParseError> {
	return Effect.try({
		try: () => {
			if (!Array.isArray(raw)) {
				throw new Error("Invalid batch response: expected array");
			}
			return from(raw);
		},
		catch: (error) =>
			new JsonRpcParseError(
				raw,
				error instanceof Error ? error.message : "Parse failed",
			),
	});
}

export function findById(
	batch: BatchResponseType,
): (id: JsonRpcIdType) => JsonRpcResponseType | undefined {
	return (id: JsonRpcIdType) => batch.find((r) => r.id === id);
}

export function errors(batch: BatchResponseType): JsonRpcErrorResponseType[] {
	return batch.filter(isError) as JsonRpcErrorResponseType[];
}

export function results(batch: BatchResponseType): JsonRpcResponseType[] {
	return [...batch];
}

export const BatchResponse = {
	from,
	parse,
	findById,
	errors,
	results,
};
