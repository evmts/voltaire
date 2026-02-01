import { describe, expect, it } from "@effect/vitest";
import type {
	KzgBlobType,
	KzgCommitmentType,
	KzgProofType,
} from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import {
	blobToKzgCommitment,
	computeBlobKzgProof,
	KZGService,
	KZGTest,
	verifyBlobKzgProof,
} from "./index.js";

describe("KZGService", () => {
	describe("KZGTest", () => {
		it.effect("blobToKzgCommitment returns 48-byte commitment", () =>
			Effect.gen(function* () {
				const kzg = yield* KZGService;
				const result = yield* kzg.blobToKzgCommitment(
					new Uint8Array(131072) as KzgBlobType,
				);
				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.length).toBe(48);
			}).pipe(Effect.provide(KZGTest)),
		);

		it.effect("computeBlobKzgProof returns 48-byte proof", () =>
			Effect.gen(function* () {
				const kzg = yield* KZGService;
				const blob = new Uint8Array(131072) as KzgBlobType;
				const commitment = new Uint8Array(48) as KzgCommitmentType;
				const result = yield* kzg.computeBlobKzgProof(blob, commitment);
				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.length).toBe(48);
			}).pipe(Effect.provide(KZGTest)),
		);

		it.effect("verifyBlobKzgProof returns boolean", () =>
			Effect.gen(function* () {
				const kzg = yield* KZGService;
				const blob = new Uint8Array(131072) as KzgBlobType;
				const commitment = new Uint8Array(48) as KzgCommitmentType;
				const proof = new Uint8Array(48) as KzgProofType;
				const result = yield* kzg.verifyBlobKzgProof(blob, commitment, proof);
				expect(result).toBe(true);
			}).pipe(Effect.provide(KZGTest)),
		);

		it.effect("isInitialized returns true", () =>
			Effect.gen(function* () {
				const kzg = yield* KZGService;
				const result = yield* kzg.isInitialized();
				expect(result).toBe(true);
			}).pipe(Effect.provide(KZGTest)),
		);
	});
});

describe("blobToKzgCommitment", () => {
	it.effect("commits blob with KZGService dependency", () =>
		Effect.gen(function* () {
			const blob = new Uint8Array(131072) as KzgBlobType;
			const result = yield* blobToKzgCommitment(blob);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(48);
		}).pipe(Effect.provide(KZGTest)),
	);
});

describe("computeBlobKzgProof", () => {
	it.effect("computes proof with KZGService dependency", () =>
		Effect.gen(function* () {
			const blob = new Uint8Array(131072) as KzgBlobType;
			const commitment = new Uint8Array(48) as KzgCommitmentType;
			const result = yield* computeBlobKzgProof(blob, commitment);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(48);
		}).pipe(Effect.provide(KZGTest)),
	);
});

describe("verifyBlobKzgProof", () => {
	it.effect("verifies proof with KZGService dependency", () =>
		Effect.gen(function* () {
			const blob = new Uint8Array(131072) as KzgBlobType;
			const commitment = new Uint8Array(48) as KzgCommitmentType;
			const proof = new Uint8Array(48) as KzgProofType;
			const result = yield* verifyBlobKzgProof(blob, commitment, proof);
			expect(result).toBe(true);
		}).pipe(Effect.provide(KZGTest)),
	);
});
