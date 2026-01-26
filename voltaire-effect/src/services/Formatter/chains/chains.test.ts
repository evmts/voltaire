import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import { FormatterService } from "../FormatterService.js";
import { ArbitrumFormatter } from "./arbitrum.js";
import { OptimismFormatter } from "./optimism.js";
import { ZkSyncFormatter } from "./zksync.js";

describe("L2 formatters", () => {
	describe("OptimismFormatter", () => {
		it.effect("adds OP Stack transaction fields", () =>
			Effect.gen(function* () {
				const formatter = yield* FormatterService;
				const input = {
					hash: "0xop",
					depositNonce: "0x2",
					isSystemTx: true,
				};
				const result = yield* formatter.formatTransaction(input);
				expect(result).toMatchObject({
					depositNonce: "0x2",
					isSystemTx: true,
				});
				expect(result).not.toBe(input);
			}).pipe(Effect.provide(OptimismFormatter)),
		);

		it.effect("adds OP Stack receipt fee fields", () =>
			Effect.gen(function* () {
				const formatter = yield* FormatterService;
				const input = {
					status: "0x1",
					l1Fee: "0x10",
					l1FeeScalar: "0x01",
				};
				const result = yield* formatter.formatReceipt(input);
				expect(result).toMatchObject({
					l1Fee: "0x10",
					l1FeeScalar: "0x01",
				});
			}).pipe(Effect.provide(OptimismFormatter)),
		);
	});

	describe("ArbitrumFormatter", () => {
		it.effect("adds Arbitrum transaction fields", () =>
			Effect.gen(function* () {
				const formatter = yield* FormatterService;
				const input = {
					hash: "0xarb",
					gasUsedForL1: "0x5208",
					l1BlockNumber: "0xabc",
				};
				const result = yield* formatter.formatTransaction(input);
				expect(result).toMatchObject({
					gasUsedForL1: "0x5208",
					l1BlockNumber: "0xabc",
				});
			}).pipe(Effect.provide(ArbitrumFormatter)),
		);

		it.effect("adds Arbitrum receipt L1 gas field", () =>
			Effect.gen(function* () {
				const formatter = yield* FormatterService;
				const input = {
					status: "0x1",
					gasUsedForL1: "0x1234",
				};
				const result = yield* formatter.formatReceipt(input);
				expect(result).toMatchObject({ gasUsedForL1: "0x1234" });
			}).pipe(Effect.provide(ArbitrumFormatter)),
		);
	});

	describe("ZkSyncFormatter", () => {
		it.effect("adds zkSync block fields", () =>
			Effect.gen(function* () {
				const formatter = yield* FormatterService;
				const input = { number: "0x1", l1BatchNumber: "0x10" };
				const result = yield* formatter.formatBlock(input);
				expect(result).toMatchObject({ l1BatchNumber: "0x10" });
			}).pipe(Effect.provide(ZkSyncFormatter)),
		);

		it.effect("preserves zkSync transaction metadata", () =>
			Effect.gen(function* () {
				const formatter = yield* FormatterService;
				const input = {
					hash: "0xzk",
					l1BatchNumber: "0x20",
					l1BatchTxIndex: "0x02",
					type: "0x71",
				};
				const result = yield* formatter.formatTransaction(input);
				expect(result).toMatchObject({
					l1BatchNumber: "0x20",
					l1BatchTxIndex: "0x02",
					type: "0x71",
				});
			}).pipe(Effect.provide(ZkSyncFormatter)),
		);
	});
});
