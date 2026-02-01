import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Ref from "effect/Ref";

export type IdCounterShape = {
	readonly next: () => Effect.Effect<number>;
};

export class IdCounterService extends Context.Tag("IdCounterService")<
	IdCounterService,
	IdCounterShape
>() {}

export const IdCounterLive: Layer.Layer<IdCounterService> = Layer.effect(
	IdCounterService,
	Effect.gen(function* () {
		const ref = yield* Ref.make(0);
		return {
			next: () => Ref.updateAndGet(ref, (n) => n + 1),
		};
	}),
);
