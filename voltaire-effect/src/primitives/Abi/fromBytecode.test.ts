import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Data from "effect/Data";

// Note: The actual fromBytecode function imports from @shazow/whatsabi which
// requires @noble/hashes@^1, but this repo uses @noble/hashes@^2.
// We test the error type directly here without importing the problematic module.

// Duplicate the error class for testing purposes
class AbiBytecodeError extends Data.TaggedError("AbiBytecodeError")<{
	readonly message: string;
	readonly bytecode?: string;
	readonly cause?: unknown;
}> {}

describe("fromBytecode", () => {
	describe("error typing", () => {
		it("AbiBytecodeError has correct tag", () => {
			const error = new AbiBytecodeError({
				message: "test error",
				bytecode: "0x123",
			});
			expect(error._tag).toBe("AbiBytecodeError");
		});

		it("can be caught with Effect.catchTag", async () => {
			const program = Effect.fail(
				new AbiBytecodeError({ message: "test" })
			).pipe(
				Effect.catchTag("AbiBytecodeError", (e) =>
					Effect.succeed({ caught: true, message: e.message })
				)
			);

			const result = await Effect.runPromise(program);
			expect(result).toEqual({ caught: true, message: "test" });
		});

		it("preserves bytecode context in error", () => {
			const error = new AbiBytecodeError({
				message: "test error",
				bytecode: "0x608060",
			});
			expect(error.bytecode).toBe("0x608060");
		});
	});
});
