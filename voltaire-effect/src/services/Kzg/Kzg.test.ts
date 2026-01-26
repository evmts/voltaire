import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Option from "effect/Option";
import { describe, expect, it } from "@effect/vitest";
import { DefaultKzg } from "./DefaultKzg.js";
import { KzgError, KzgService } from "./KzgService.js";
import { NoopKzg } from "./NoopKzg.js";

function getFailure<E>(exit: Exit.Exit<unknown, E>): E | null {
	if (Exit.isFailure(exit)) {
		const option = Cause.failureOption(exit.cause);
		return Option.isSome(option) ? option.value : null;
	}
	return null;
}

describe("NoopKzg", () => {
	describe("blobToCommitment", () => {
		it.effect("fails with KzgError", () =>
			Effect.gen(function* () {
				const kzg = yield* KzgService;
				const exit = yield* Effect.exit(
					kzg.blobToCommitment(new Uint8Array(131072)),
				);
				expect(Exit.isFailure(exit)).toBe(true);
				const error = getFailure(exit);
				expect(error).toBeInstanceOf(KzgError);
				expect((error as KzgError).operation).toBe("blobToCommitment");
			}).pipe(Effect.provide(NoopKzg)),
		);

		it.effect("error message contains 'KZG not available'", () =>
			Effect.gen(function* () {
				const kzg = yield* KzgService;
				const exit = yield* Effect.exit(
					kzg.blobToCommitment(new Uint8Array(131072)),
				);
				expect(Exit.isFailure(exit)).toBe(true);
				const error = getFailure(exit);
				expect((error as KzgError).message).toContain("KZG not available");
			}).pipe(Effect.provide(NoopKzg)),
		);
	});

	describe("computeProof", () => {
		it.effect("fails with KzgError", () =>
			Effect.gen(function* () {
				const kzg = yield* KzgService;
				const exit = yield* Effect.exit(
					kzg.computeProof(new Uint8Array(131072), new Uint8Array(48)),
				);
				expect(Exit.isFailure(exit)).toBe(true);
				const error = getFailure(exit);
				expect(error).toBeInstanceOf(KzgError);
				expect((error as KzgError).operation).toBe("computeProof");
			}).pipe(Effect.provide(NoopKzg)),
		);

		it.effect("error message contains 'KZG not available'", () =>
			Effect.gen(function* () {
				const kzg = yield* KzgService;
				const exit = yield* Effect.exit(
					kzg.computeProof(new Uint8Array(131072), new Uint8Array(48)),
				);
				expect(Exit.isFailure(exit)).toBe(true);
				const error = getFailure(exit);
				expect((error as KzgError).message).toContain("KZG not available");
			}).pipe(Effect.provide(NoopKzg)),
		);
	});

	describe("verifyProof", () => {
		it.effect("fails with KzgError", () =>
			Effect.gen(function* () {
				const kzg = yield* KzgService;
				const exit = yield* Effect.exit(
					kzg.verifyProof(
						new Uint8Array(48),
						new Uint8Array(32),
						new Uint8Array(32),
						new Uint8Array(48),
					),
				);
				expect(Exit.isFailure(exit)).toBe(true);
				const error = getFailure(exit);
				expect(error).toBeInstanceOf(KzgError);
				expect((error as KzgError).operation).toBe("verifyProof");
			}).pipe(Effect.provide(NoopKzg)),
		);

		it.effect("error message contains 'KZG not available'", () =>
			Effect.gen(function* () {
				const kzg = yield* KzgService;
				const exit = yield* Effect.exit(
					kzg.verifyProof(
						new Uint8Array(48),
						new Uint8Array(32),
						new Uint8Array(32),
						new Uint8Array(48),
					),
				);
				expect(Exit.isFailure(exit)).toBe(true);
				const error = getFailure(exit);
				expect((error as KzgError).message).toContain("KZG not available");
			}).pipe(Effect.provide(NoopKzg)),
		);
	});
});

describe("DefaultKzg", () => {
	describe("blobToCommitment", () => {
		it.effect.skip("fails with KzgError when blob size is wrong (requires WASM)", () =>
			Effect.gen(function* () {
				const kzg = yield* KzgService;
				const exit = yield* Effect.exit(
					kzg.blobToCommitment(new Uint8Array(100)),
				);
				expect(Exit.isFailure(exit)).toBe(true);
				const error = getFailure(exit);
				expect(error).toBeInstanceOf(KzgError);
				expect((error as KzgError).operation).toBe("blobToCommitment");
			}).pipe(Effect.provide(DefaultKzg)),
		);

		it.effect.skip("fails with KzgError for empty blob (requires WASM)", () =>
			Effect.gen(function* () {
				const kzg = yield* KzgService;
				const exit = yield* Effect.exit(
					kzg.blobToCommitment(new Uint8Array(0)),
				);
				expect(Exit.isFailure(exit)).toBe(true);
				const error = getFailure(exit);
				expect(error).toBeInstanceOf(KzgError);
				expect((error as KzgError).operation).toBe("blobToCommitment");
			}).pipe(Effect.provide(DefaultKzg)),
		);

		it.effect.skip("succeeds with correct blob size (131072 bytes)", () =>
			Effect.gen(function* () {
				const kzg = yield* KzgService;
				const blob = new Uint8Array(131072);
				const commitment = yield* kzg.blobToCommitment(blob);
				expect(commitment).toBeInstanceOf(Uint8Array);
				expect(commitment.length).toBe(48);
			}).pipe(Effect.provide(DefaultKzg)),
		);
	});

	describe("computeProof", () => {
		it.effect.skip("fails with KzgError when blob size is wrong (requires WASM)", () =>
			Effect.gen(function* () {
				const kzg = yield* KzgService;
				const exit = yield* Effect.exit(
					kzg.computeProof(new Uint8Array(100), new Uint8Array(48)),
				);
				expect(Exit.isFailure(exit)).toBe(true);
				const error = getFailure(exit);
				expect(error).toBeInstanceOf(KzgError);
				expect((error as KzgError).operation).toBe("computeProof");
			}).pipe(Effect.provide(DefaultKzg)),
		);

		it.effect.skip("fails with KzgError when commitment size is wrong (requires WASM)", () =>
			Effect.gen(function* () {
				const kzg = yield* KzgService;
				const exit = yield* Effect.exit(
					kzg.computeProof(new Uint8Array(131072), new Uint8Array(10)),
				);
				expect(Exit.isFailure(exit)).toBe(true);
				const error = getFailure(exit);
				expect(error).toBeInstanceOf(KzgError);
				expect((error as KzgError).operation).toBe("computeProof");
			}).pipe(Effect.provide(DefaultKzg)),
		);

		it.effect.skip("succeeds with correct sizes", () =>
			Effect.gen(function* () {
				const kzg = yield* KzgService;
				const blob = new Uint8Array(131072);
				const commitment = yield* kzg.blobToCommitment(blob);
				const proof = yield* kzg.computeProof(blob, commitment);
				expect(proof).toBeInstanceOf(Uint8Array);
				expect(proof.length).toBe(48);
			}).pipe(Effect.provide(DefaultKzg)),
		);
	});

	describe("verifyProof", () => {
		it.effect.skip("fails with KzgError when commitment size is wrong (requires WASM)", () =>
			Effect.gen(function* () {
				const kzg = yield* KzgService;
				const exit = yield* Effect.exit(
					kzg.verifyProof(
						new Uint8Array(10),
						new Uint8Array(32),
						new Uint8Array(32),
						new Uint8Array(48),
					),
				);
				expect(Exit.isFailure(exit)).toBe(true);
				const error = getFailure(exit);
				expect(error).toBeInstanceOf(KzgError);
				expect((error as KzgError).operation).toBe("verifyProof");
			}).pipe(Effect.provide(DefaultKzg)),
		);

		it.effect.skip("fails with KzgError when z size is wrong (requires WASM)", () =>
			Effect.gen(function* () {
				const kzg = yield* KzgService;
				const exit = yield* Effect.exit(
					kzg.verifyProof(
						new Uint8Array(48),
						new Uint8Array(10),
						new Uint8Array(32),
						new Uint8Array(48),
					),
				);
				expect(Exit.isFailure(exit)).toBe(true);
				const error = getFailure(exit);
				expect(error).toBeInstanceOf(KzgError);
				expect((error as KzgError).operation).toBe("verifyProof");
			}).pipe(Effect.provide(DefaultKzg)),
		);

		it.effect.skip("fails with KzgError when y size is wrong (requires WASM)", () =>
			Effect.gen(function* () {
				const kzg = yield* KzgService;
				const exit = yield* Effect.exit(
					kzg.verifyProof(
						new Uint8Array(48),
						new Uint8Array(32),
						new Uint8Array(10),
						new Uint8Array(48),
					),
				);
				expect(Exit.isFailure(exit)).toBe(true);
				const error = getFailure(exit);
				expect(error).toBeInstanceOf(KzgError);
				expect((error as KzgError).operation).toBe("verifyProof");
			}).pipe(Effect.provide(DefaultKzg)),
		);

		it.effect.skip("fails with KzgError when proof size is wrong (requires WASM)", () =>
			Effect.gen(function* () {
				const kzg = yield* KzgService;
				const exit = yield* Effect.exit(
					kzg.verifyProof(
						new Uint8Array(48),
						new Uint8Array(32),
						new Uint8Array(32),
						new Uint8Array(10),
					),
				);
				expect(Exit.isFailure(exit)).toBe(true);
				const error = getFailure(exit);
				expect(error).toBeInstanceOf(KzgError);
				expect((error as KzgError).operation).toBe("verifyProof");
			}).pipe(Effect.provide(DefaultKzg)),
		);
	});
});

describe("KzgError", () => {
	it("has correct _tag", () => {
		const error = new KzgError({
			operation: "blobToCommitment",
			message: "test error",
		});
		expect(error._tag).toBe("KzgError");
	});

	it("preserves operation field", () => {
		const error = new KzgError({
			operation: "computeProof",
			message: "test error",
		});
		expect(error.operation).toBe("computeProof");
	});

	it("preserves message field", () => {
		const error = new KzgError({
			operation: "verifyProof",
			message: "custom message",
		});
		expect(error.message).toBe("custom message");
	});

	it("preserves cause field when provided", () => {
		const cause = new Error("underlying error");
		const error = new KzgError({
			operation: "blobToCommitment",
			message: "test error",
			cause,
		});
		expect(error.cause).toBe(cause);
	});

	it("cause is undefined when not provided", () => {
		const error = new KzgError({
			operation: "blobToCommitment",
			message: "test error",
		});
		expect(error.cause).toBeUndefined();
	});
});
