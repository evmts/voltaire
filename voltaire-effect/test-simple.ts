import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import * as Request from "effect/Request";
import * as RequestResolver from "effect/RequestResolver";

// Simple request type
class TestRequest extends Data.TaggedClass("TestRequest")<{ id: number }> {}
interface TestRequest extends Request.Request<string, Error> {}

const resolver = RequestResolver.makeBatched(
	(requests: readonly TestRequest[]) =>
		Effect.forEach(
			requests,
			(req) => Request.succeed(req, `result-${req.id}`),
			{ discard: true },
		),
);

const req = new TestRequest({ id: 42 });

// Try using the data-last (curried) style
const program = Effect.request(resolver)(req);
console.log("Effect.request(resolver)(req):", program);
console.log("Is it an effect?:", Effect.isEffect(program));

Effect.runPromise(program).then(console.log).catch(console.error);
