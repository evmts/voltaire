/**
 * @fileoverview Shared JSON-RPC request ID generator.
 *
 * @module IdGenerator
 * @since 0.0.1
 *
 * @description
 * Provides a shared, process-wide ID generator for JSON-RPC requests. Uses a
 * single Ref-backed counter to avoid ID collisions across transports and batch
 * calls. Can be overridden in a scoped environment for testing or custom
 * behavior.
 */

import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Ref from "effect/Ref";

/**
 * Shape of the ID generator service.
 *
 * @since 0.0.1
 */
export type IdGeneratorShape = {
	/** Returns the next unique JSON-RPC request ID. */
	readonly next: () => Effect.Effect<number>;
};

/**
 * ID generator service tag.
 *
 * @since 0.0.1
 */
export class IdGenerator extends Context.Tag("IdGenerator")<
	IdGenerator,
	IdGeneratorShape
>() {}

const sharedRef = Ref.unsafeMake(0);

const sharedGenerator: IdGeneratorShape = {
	next: () => Ref.updateAndGet(sharedRef, (n) => n + 1),
};

/**
 * Live layer providing the shared ID generator.
 *
 * @since 0.0.1
 */
export const IdGeneratorLive: Layer.Layer<IdGenerator> = Layer.succeed(
	IdGenerator,
	sharedGenerator,
);

/**
 * Creates a new isolated ID generator (useful for tests).
 *
 * @since 0.0.1
 */
export const makeIdGenerator = (
	start = 0,
): Effect.Effect<IdGeneratorShape> =>
	Effect.gen(function* () {
		const ref = yield* Ref.make(start);
		return {
			next: () => Ref.updateAndGet(ref, (n) => n + 1),
		};
	});

/**
 * Returns the next ID from the environment if provided, otherwise uses the
 * shared generator.
 *
 * @since 0.0.1
 */
export const nextId: Effect.Effect<number> = Effect.flatMap(
	Effect.serviceOption(IdGenerator),
	(option) =>
		Option.match(option, {
			onNone: () => sharedGenerator.next(),
			onSome: (generator) => generator.next(),
		}),
);

