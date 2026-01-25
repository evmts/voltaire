/**
 * @fileoverview Default ABI encoder implementation using @tevm/voltaire.
 *
 * @module DefaultAbiEncoder
 * @since 0.0.1
 *
 * @description
 * Provides the live implementation of AbiEncoderService using the
 * BrandedAbi primitives from @tevm/voltaire.
 *
 * @see {@link AbiEncoderService} - The service definition
 */

import { BrandedAbi, type BrandedHash, Hash, Hex } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import {
	AbiDecodeError,
	AbiEncodeError,
	AbiEncoderService,
} from "./AbiEncoderService.js";

type HashType = BrandedHash.HashType;

/**
 * Finds an event definition in an ABI by name.
 */
function findEvent(
	abi: readonly unknown[],
	eventName: string,
): BrandedAbi.Event.EventType {
	const event = (abi as readonly BrandedAbi.Item.ItemType[]).find(
		(item): item is BrandedAbi.Event.EventType =>
			item.type === "event" && item.name === eventName,
	);
	if (!event) {
		throw new Error(`Event ${eventName} not found in ABI`);
	}
	return event;
}

/**
 * Finds a function definition in an ABI by name.
 */
function findFunction(
	abi: readonly unknown[],
	functionName: string,
): BrandedAbi.Function.FunctionType {
	const fn = (abi as readonly BrandedAbi.Item.ItemType[]).find(
		(item): item is BrandedAbi.Function.FunctionType =>
			item.type === "function" && item.name === functionName,
	);
	if (!fn) {
		throw new Error(`Function ${functionName} not found in ABI`);
	}
	return fn;
}

/**
 * Default ABI encoder layer using @tevm/voltaire primitives.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { AbiEncoderService, DefaultAbiEncoder } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const encoder = yield* AbiEncoderService
 *   return yield* encoder.encodeFunction(abi, 'transfer', [to, amount])
 * }).pipe(
 *   Effect.provide(DefaultAbiEncoder)
 * )
 * ```
 */
export const DefaultAbiEncoder = Layer.succeed(AbiEncoderService, {
	encodeFunction: (abi, functionName, args) =>
		Effect.try({
			try: () => {
				const encoded = BrandedAbi.encodeFunction(
					abi as unknown as BrandedAbi.Abi,
					functionName,
					args as unknown[],
				);
				return encoded as `0x${string}`;
			},
			catch: (error) =>
				new AbiEncodeError({
					functionName,
					args,
					message:
						error instanceof Error ? error.message : "Failed to encode function",
					cause: error,
				}),
		}),

	decodeFunction: (abi, functionName, data) =>
		Effect.try({
			try: () => {
				const fn = findFunction(abi, functionName);
				const bytes = Hex.toBytes(data);
				const decoded = BrandedAbi.Function.decodeResult(fn, bytes);
				return decoded as readonly unknown[];
			},
			catch: (error) =>
				new AbiDecodeError({
					data,
					message:
						error instanceof Error
							? error.message
							: "Failed to decode function result",
					cause: error,
				}),
		}),

	encodeEventTopics: (abi, eventName, args) =>
		Effect.try({
			try: () => {
				const event = findEvent(abi, eventName);
				const selector = BrandedAbi.Event.getSelector(event);
				const topics: `0x${string}`[] = [Hash.toHex(selector) as `0x${string}`];

				if (args && args.length > 0) {
					const argsRecord: Record<string, unknown> = {};
					const indexedInputs = event.inputs.filter((input) => input.indexed);
					for (let i = 0; i < args.length && i < indexedInputs.length; i++) {
						const input = indexedInputs[i];
						if (input?.name) {
							argsRecord[input.name] = args[i];
						}
					}
					const encodedTopics = BrandedAbi.Event.encodeTopics(event, argsRecord);
					for (let i = 1; i < encodedTopics.length; i++) {
						const topic = encodedTopics[i];
						if (topic !== null) {
							topics.push(Hash.toHex(topic as HashType) as `0x${string}`);
						}
					}
				}

				return topics as readonly `0x${string}`[];
			},
			catch: (error) =>
				new AbiEncodeError({
					functionName: eventName,
					args: args ?? [],
					message:
						error instanceof Error
							? error.message
							: "Failed to encode event topics",
					cause: error,
				}),
		}),

	decodeEventLog: (abi, eventName, data, topics) =>
		Effect.try({
			try: () => {
				const event = findEvent(abi, eventName);
				const dataBytes = Hex.toBytes(data);
				const topicBytes = topics.map((t) =>
					Hex.toBytes(t),
				) as unknown as readonly HashType[];
				const decoded = BrandedAbi.Event.decodeLog(event, dataBytes, topicBytes);
				return decoded as Record<string, unknown>;
			},
			catch: (error) =>
				new AbiDecodeError({
					data,
					message:
						error instanceof Error ? error.message : "Failed to decode event log",
					cause: error,
				}),
		}),
});
