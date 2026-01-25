import { Data } from "effect";

export class StandardsError extends Data.TaggedError("StandardsError")<{
	readonly operation: string;
	readonly message: string;
	readonly cause?: unknown;
}> {}
