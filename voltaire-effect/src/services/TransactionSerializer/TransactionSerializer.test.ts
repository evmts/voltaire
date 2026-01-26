import { describe, expect, it } from "@effect/vitest";
import { Address, Hex } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { DefaultTransactionSerializer } from "./DefaultTransactionSerializer.js";
import {
	DeserializeError,
	SerializeError,
	TransactionSerializerService,
} from "./TransactionSerializerService.js";

const EIP1559_TX = {
	type: 2 as const,
	chainId: 1n,
	nonce: 0n,
	maxFeePerGas: 20000000000n,
	maxPriorityFeePerGas: 1000000000n,
	gasLimit: 21000n,
	to: Address.from("0x1234567890123456789012345678901234567890"),
	value: 1000000000000000000n,
	data: Hex.toBytes("0x"),
	accessList: [] as const,
	yParity: 0,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

describe("TransactionSerializerService", () => {
	describe("serialize", () => {
		it.effect("returns Uint8Array for valid transaction", () =>
			Effect.gen(function* () {
				const serializer = yield* TransactionSerializerService;
				const result = yield* serializer.serialize(EIP1559_TX);
				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.length).toBeGreaterThan(0);
			}).pipe(Effect.provide(DefaultTransactionSerializer.Live)),
		);

		it.effect("returns SerializeError for invalid transaction shape", () =>
			Effect.gen(function* () {
				const serializer = yield* TransactionSerializerService;
				const invalidTx = { invalid: "transaction" };
				const exit = yield* Effect.exit(serializer.serialize(invalidTx));
				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit)) {
					const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
					expect(error).toBeInstanceOf(SerializeError);
					expect((error as SerializeError)._tag).toBe("SerializeError");
					expect((error as SerializeError).transaction).toEqual(invalidTx);
					expect((error as SerializeError).cause).toBeDefined();
				}
			}).pipe(Effect.provide(DefaultTransactionSerializer.Live)),
		);

		it.effect("can catch SerializeError by tag", () =>
			Effect.gen(function* () {
				const serializer = yield* TransactionSerializerService;
				const result = yield* serializer
					.serialize({})
					.pipe(
						Effect.catchTag("SerializeError", (e) =>
							Effect.succeed(`caught: ${e._tag}`),
						),
					);
				expect(result).toBe("caught: SerializeError");
			}).pipe(Effect.provide(DefaultTransactionSerializer.Live)),
		);
	});

	describe("deserialize", () => {
		it.effect("returns transaction object for valid bytes", () =>
			Effect.gen(function* () {
				const serializer = yield* TransactionSerializerService;
				const bytes = yield* serializer.serialize(EIP1559_TX);
				const result = yield* serializer.deserialize(bytes);
				expect(result).toBeDefined();
				expect(typeof result).toBe("object");
			}).pipe(Effect.provide(DefaultTransactionSerializer.Live)),
		);

		it.effect("returns DeserializeError for invalid bytes", () =>
			Effect.gen(function* () {
				const serializer = yield* TransactionSerializerService;
				const invalidBytes = new Uint8Array([0xff, 0xfe, 0xfd]);
				const exit = yield* Effect.exit(serializer.deserialize(invalidBytes));
				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit)) {
					const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
					expect(error).toBeInstanceOf(DeserializeError);
					expect((error as DeserializeError)._tag).toBe("DeserializeError");
					expect((error as DeserializeError).bytes).toEqual(invalidBytes);
					expect((error as DeserializeError).cause).toBeDefined();
				}
			}).pipe(Effect.provide(DefaultTransactionSerializer.Live)),
		);

		it.effect("can catch DeserializeError by tag", () =>
			Effect.gen(function* () {
				const serializer = yield* TransactionSerializerService;
				const result = yield* serializer
					.deserialize(new Uint8Array([0x00]))
					.pipe(
						Effect.catchTag("DeserializeError", (e) =>
							Effect.succeed(`caught: ${e._tag}`),
						),
					);
				expect(result).toBe("caught: DeserializeError");
			}).pipe(Effect.provide(DefaultTransactionSerializer.Live)),
		);
	});

	describe("getSigningPayload", () => {
		it.effect("returns 32-byte hash", () =>
			Effect.gen(function* () {
				const serializer = yield* TransactionSerializerService;
				const result = yield* serializer.getSigningPayload(EIP1559_TX);
				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.length).toBe(32);
			}).pipe(Effect.provide(DefaultTransactionSerializer.Live)),
		);

		it.effect("is deterministic - same tx produces same hash", () =>
			Effect.gen(function* () {
				const serializer = yield* TransactionSerializerService;
				const hash1 = yield* serializer.getSigningPayload(EIP1559_TX);
				const hash2 = yield* serializer.getSigningPayload(EIP1559_TX);
				expect(hash1).toEqual(hash2);
			}).pipe(Effect.provide(DefaultTransactionSerializer.Live)),
		);

		it.effect("different tx produces different hash", () =>
			Effect.gen(function* () {
				const serializer = yield* TransactionSerializerService;
				const modifiedTx = { ...EIP1559_TX, nonce: 1n };
				const hash1 = yield* serializer.getSigningPayload(EIP1559_TX);
				const hash2 = yield* serializer.getSigningPayload(modifiedTx);
				expect(hash1).not.toEqual(hash2);
			}).pipe(Effect.provide(DefaultTransactionSerializer.Live)),
		);

		it.effect("returns SerializeError for invalid transaction", () =>
			Effect.gen(function* () {
				const serializer = yield* TransactionSerializerService;
				const invalidTx = { type: 999, invalid: true };
				const exit = yield* Effect.exit(
					serializer.getSigningPayload(invalidTx),
				);
				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit)) {
					const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
					expect(error).toBeInstanceOf(SerializeError);
					expect((error as SerializeError).transaction).toEqual(invalidTx);
				}
			}).pipe(Effect.provide(DefaultTransactionSerializer.Live)),
		);
	});

	describe("round-trip", () => {
		it.effect("serialize -> deserialize preserves key fields", () =>
			Effect.gen(function* () {
				const serializer = yield* TransactionSerializerService;
				const bytes = yield* serializer.serialize(EIP1559_TX);
				const decoded = (yield* serializer.deserialize(bytes)) as Record<
					string,
					unknown
				>;
				expect(decoded.type).toBe(EIP1559_TX.type);
				expect(decoded.chainId).toBe(EIP1559_TX.chainId);
				expect(decoded.nonce).toBe(EIP1559_TX.nonce);
				expect(decoded.maxFeePerGas).toBe(EIP1559_TX.maxFeePerGas);
				expect(decoded.maxPriorityFeePerGas).toBe(
					EIP1559_TX.maxPriorityFeePerGas,
				);
				expect(decoded.gasLimit).toBe(EIP1559_TX.gasLimit);
				expect(decoded.value).toBe(EIP1559_TX.value);
			}).pipe(Effect.provide(DefaultTransactionSerializer.Live)),
		);

		it.effect("preserves 'to' address in round-trip", () =>
			Effect.gen(function* () {
				const serializer = yield* TransactionSerializerService;
				const bytes = yield* serializer.serialize(EIP1559_TX);
				const decoded = (yield* serializer.deserialize(bytes)) as Record<
					string,
					unknown
				>;
				const toAddress = decoded.to as Uint8Array | string;
				const expectedHex = Address.toHex(EIP1559_TX.to).toLowerCase();
				if (toAddress instanceof Uint8Array) {
					const hex = Array.from(toAddress)
						.map((b) => b.toString(16).padStart(2, "0"))
						.join("");
					expect(`0x${hex}`).toBe(expectedHex);
				} else if (typeof toAddress === "string") {
					expect(toAddress.toLowerCase()).toBe(expectedHex);
				}
			}).pipe(Effect.provide(DefaultTransactionSerializer.Live)),
		);
	});
});
