/**
 * @fileoverview Tests for BlockStreamService.
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Stream from "effect/Stream";
import { describe, expect, it } from "vitest";
import { TransportService, type TransportShape } from "../Transport/index.js";
import { BlockStreamService } from "./BlockStreamService.js";
import { BlockStream } from "./BlockStream.js";
import { BlockStreamError } from "./BlockStreamError.js";

describe("BlockStreamService", () => {
	describe("BlockStreamError", () => {
		it("creates error with message", () => {
			const error = new BlockStreamError("test error");
			expect(error.message).toBe("test error");
			expect(error._tag).toBe("BlockStreamError");
		});

		it("creates error with cause", () => {
			const cause = new Error("underlying");
			const error = new BlockStreamError("test error", { cause });
			expect(error.message).toContain("test error");
			expect(error.cause).toBe(cause);
		});
	});

	describe("BlockStream layer", () => {
		it("provides BlockStreamService from TransportService", async () => {
			const mockTransport: TransportShape = {
				request: <T>(_method: string, _params?: unknown[]): Effect.Effect<T, never> =>
					Effect.succeed("0x1" as T),
			};

			const TestTransportLayer = Layer.succeed(TransportService, mockTransport);
			const TestBlockStreamLayer = Layer.provide(BlockStream, TestTransportLayer);

			const program = Effect.gen(function* () {
				const blockStream = yield* BlockStreamService;
				expect(blockStream.backfill).toBeDefined();
				expect(blockStream.watch).toBeDefined();
				expect(typeof blockStream.backfill).toBe("function");
				expect(typeof blockStream.watch).toBe("function");
			}).pipe(Effect.provide(TestBlockStreamLayer));

			await Effect.runPromise(program);
		});
	});

	describe("exports", () => {
		it("exports from index", async () => {
			const { BlockStream, BlockStreamError, BlockStreamService } = await import("./index.js");
			expect(BlockStream).toBeDefined();
			expect(BlockStreamError).toBeDefined();
			expect(BlockStreamService).toBeDefined();
		});
	});
});
