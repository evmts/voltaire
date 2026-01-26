import { Effect } from "effect";
import { Hash, Hex } from "voltaire-effect/primitives";

// Voltaire Effect - composable, typed effects over Voltaire primitives

const program = Effect.gen(function* () {
	const randomHex = yield* Hex.random(8);
	const isSized = yield* Hex.isSized(randomHex, 8);

	const hash = yield* Hash.keccak256String("voltaire-effect");
	const display = yield* Hash.format(hash, 10, 6);

	return { randomHex, isSized, display };
});

Effect.runPromise(program)
	.then(({ randomHex, isSized, display }) => {
		console.log("Random hex (8 bytes):", randomHex);
		console.log("Is sized:", isSized);
		console.log("Keccak256 hash:", display);
	})
	.catch((error) => {
		console.error("Effect program failed:", error);
	});
