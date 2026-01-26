import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import { describe, expect, it, vi } from "@effect/vitest";
import {
	type Block,
	BlockchainError,
	BlockchainService,
	type BlockchainShape,
	type HexInput,
} from "./BlockchainService.js";

const createMockBlock = (overrides: Partial<Block> = {}): Block => ({
	hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as const,
	parentHash:
		"0x0000000000000000000000000000000000000000000000000000000000000000" as const,
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347" as const,
	beneficiary: "0x0000000000000000000000000000000000000000" as const,
	stateRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421" as const,
	transactionsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421" as const,
	receiptsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421" as const,
	logsBloom: "0x00" as const,
	difficulty: 0n,
	number: 1n,
	gasLimit: 30000000n,
	gasUsed: 0n,
	timestamp: 1234567890n,
	extraData: "0x" as const,
	mixHash:
		"0x0000000000000000000000000000000000000000000000000000000000000000" as const,
	nonce: 0n,
	transactions: "0x" as const,
	ommers: "0x" as const,
	withdrawals: "0x" as const,
	size: 1000n,
	...overrides,
});

const mockBlockchain = (
	overrides: Partial<BlockchainShape> = {},
): Layer.Layer<BlockchainService, never, never> => {
	const blocks = new Map<string, Block>();
	let headHash: string | null = null;

	const defaultImpl: BlockchainShape = {
		getBlockByHash: (hash) =>
			Effect.succeed(blocks.get(hash as string) ?? null),
		getBlockByNumber: (number) => {
			for (const block of blocks.values()) {
				if (block.number === number) return Effect.succeed(block);
			}
			return Effect.succeed(null);
		},
		getCanonicalHash: (number) => {
			for (const block of blocks.values()) {
				if (block.number === number) return Effect.succeed(block.hash);
			}
			return Effect.succeed(null);
		},
		getHeadBlockNumber: () => {
			if (!headHash) return Effect.succeed(null);
			const block = blocks.get(headHash);
			return Effect.succeed(block?.number ?? null);
		},
		putBlock: (block) =>
			Effect.sync(() => {
				blocks.set(block.hash as string, block);
				if (!headHash || block.number > (blocks.get(headHash)?.number ?? 0n)) {
					headHash = block.hash as string;
				}
			}),
		setCanonicalHead: (hash) => {
			if (!blocks.has(hash as string)) {
				return Effect.fail(
					new BlockchainError({ hash }, "Block not found", {
						code: "BLOCK_NOT_FOUND",
					}),
				);
			}
			headHash = hash as string;
			return Effect.succeed(undefined);
		},
		hasBlock: (hash) => Effect.succeed(blocks.has(hash as string)),
		localBlockCount: () => Effect.succeed(blocks.size),
		orphanCount: () => Effect.succeed(0),
		canonicalChainLength: () => Effect.succeed(blocks.size),
		isForkBlock: () => Effect.succeed(false),
		destroy: () => Effect.sync(() => blocks.clear()),
	};

	return Layer.succeed(BlockchainService, { ...defaultImpl, ...overrides });
};

describe("BlockchainService", () => {
	describe("getBlockByHash", () => {
		it("returns null for non-existent block", async () => {
			const layer = mockBlockchain();

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const blockchain = yield* BlockchainService;
					return yield* blockchain.getBlockByHash(
						"0xdeadbeef00000000000000000000000000000000000000000000000000000000",
					);
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBeNull();
		});

		it("returns block when it exists", async () => {
			const block = createMockBlock();
			const layer = mockBlockchain();

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const blockchain = yield* BlockchainService;
					yield* blockchain.putBlock(block);
					return yield* blockchain.getBlockByHash(block.hash);
				}).pipe(Effect.provide(layer)),
			);

			expect(result).not.toBeNull();
			expect(result?.hash).toBe(block.hash);
			expect(result?.number).toBe(1n);
		});
	});

	describe("getBlockByNumber", () => {
		it("returns null for non-existent block number", async () => {
			const layer = mockBlockchain();

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const blockchain = yield* BlockchainService;
					return yield* blockchain.getBlockByNumber(999999n);
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBeNull();
		});

		it("returns block by number", async () => {
			const block = createMockBlock({ number: 42n });
			const layer = mockBlockchain();

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const blockchain = yield* BlockchainService;
					yield* blockchain.putBlock(block);
					return yield* blockchain.getBlockByNumber(42n);
				}).pipe(Effect.provide(layer)),
			);

			expect(result).not.toBeNull();
			expect(result?.number).toBe(42n);
		});
	});

	describe("getHeadBlockNumber", () => {
		it("returns null when no blocks", async () => {
			const layer = mockBlockchain();

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const blockchain = yield* BlockchainService;
					return yield* blockchain.getHeadBlockNumber();
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBeNull();
		});

		it("returns head block number after putting blocks", async () => {
			const block1 = createMockBlock({ number: 1n });
			const block2 = createMockBlock({
				number: 2n,
				hash: "0xabcdef0000000000000000000000000000000000000000000000000000000000",
				parentHash: block1.hash,
			});
			const layer = mockBlockchain();

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const blockchain = yield* BlockchainService;
					yield* blockchain.putBlock(block1);
					yield* blockchain.putBlock(block2);
					return yield* blockchain.getHeadBlockNumber();
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(2n);
		});
	});

	describe("putBlock", () => {
		it("stores block successfully", async () => {
			const block = createMockBlock();
			const layer = mockBlockchain();

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const blockchain = yield* BlockchainService;
					yield* blockchain.putBlock(block);
					return yield* blockchain.hasBlock(block.hash);
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(true);
		});
	});

	describe("setCanonicalHead", () => {
		it("fails for non-existent block", async () => {
			const layer = mockBlockchain();

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const blockchain = yield* BlockchainService;
					return yield* blockchain.setCanonicalHead(
						"0xdeadbeef00000000000000000000000000000000000000000000000000000000",
					);
				}).pipe(Effect.provide(layer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect(error).toBeInstanceOf(BlockchainError);
				expect((error as BlockchainError).errorCode).toBe("BLOCK_NOT_FOUND");
			}
		});

		it("sets canonical head for existing block", async () => {
			const block = createMockBlock();
			const layer = mockBlockchain();

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const blockchain = yield* BlockchainService;
					yield* blockchain.putBlock(block);
					yield* blockchain.setCanonicalHead(block.hash);
					return yield* blockchain.getHeadBlockNumber();
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(1n);
		});
	});

	describe("hasBlock", () => {
		it("returns false for non-existent block", async () => {
			const layer = mockBlockchain();

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const blockchain = yield* BlockchainService;
					return yield* blockchain.hasBlock(
						"0xdeadbeef00000000000000000000000000000000000000000000000000000000",
					);
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(false);
		});

		it("returns true for existing block", async () => {
			const block = createMockBlock();
			const layer = mockBlockchain();

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const blockchain = yield* BlockchainService;
					yield* blockchain.putBlock(block);
					return yield* blockchain.hasBlock(block.hash);
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(true);
		});
	});

	describe("statistics", () => {
		it("returns correct local block count", async () => {
			const block1 = createMockBlock({ number: 1n });
			const block2 = createMockBlock({
				number: 2n,
				hash: "0xabcdef0000000000000000000000000000000000000000000000000000000000",
			});
			const layer = mockBlockchain();

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const blockchain = yield* BlockchainService;
					yield* blockchain.putBlock(block1);
					yield* blockchain.putBlock(block2);
					return yield* blockchain.localBlockCount();
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(2);
		});

		it("returns orphan count", async () => {
			const layer = mockBlockchain({ orphanCount: () => Effect.succeed(5) });

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const blockchain = yield* BlockchainService;
					return yield* blockchain.orphanCount();
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(5);
		});

		it("returns canonical chain length", async () => {
			const block = createMockBlock();
			const layer = mockBlockchain();

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const blockchain = yield* BlockchainService;
					yield* blockchain.putBlock(block);
					return yield* blockchain.canonicalChainLength();
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(1);
		});
	});

	describe("isForkBlock", () => {
		it("returns false by default", async () => {
			const layer = mockBlockchain();

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const blockchain = yield* BlockchainService;
					return yield* blockchain.isForkBlock(1000n);
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(false);
		});

		it("returns true when configured in fork mode", async () => {
			const layer = mockBlockchain({
				isForkBlock: (n) => Effect.succeed(n <= 18000000n),
			});

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const blockchain = yield* BlockchainService;
					const belowFork = yield* blockchain.isForkBlock(17999999n);
					const atFork = yield* blockchain.isForkBlock(18000000n);
					const aboveFork = yield* blockchain.isForkBlock(18000001n);
					return { belowFork, atFork, aboveFork };
				}).pipe(Effect.provide(layer)),
			);

			expect(result.belowFork).toBe(true);
			expect(result.atFork).toBe(true);
			expect(result.aboveFork).toBe(false);
		});
	});

	describe("getCanonicalHash", () => {
		it("returns null for non-existent block number", async () => {
			const layer = mockBlockchain();

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const blockchain = yield* BlockchainService;
					return yield* blockchain.getCanonicalHash(999999n);
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBeNull();
		});

		it("returns hash for existing block number", async () => {
			const block = createMockBlock({ number: 42n });
			const layer = mockBlockchain();

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const blockchain = yield* BlockchainService;
					yield* blockchain.putBlock(block);
					return yield* blockchain.getCanonicalHash(42n);
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(block.hash);
		});
	});

	describe("destroy", () => {
		it("cleans up resources", async () => {
			const destroyFn = vi.fn();
			const layer = mockBlockchain({
				destroy: () =>
					Effect.sync(() => {
						destroyFn();
					}),
			});

			await Effect.runPromise(
				Effect.gen(function* () {
					const blockchain = yield* BlockchainService;
					yield* blockchain.destroy();
				}).pipe(Effect.provide(layer)),
			);

			expect(destroyFn).toHaveBeenCalledOnce();
		});
	});

	describe("error handling", () => {
		it("propagates BlockchainError with correct tag", async () => {
			const layer = mockBlockchain({
				getBlockByHash: () =>
					Effect.fail(
						new BlockchainError({ hash: "0x..." }, "Custom error", {
							code: "CUSTOM_ERROR",
						}),
					),
			});

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const blockchain = yield* BlockchainService;
					return yield* blockchain.getBlockByHash("0x...");
				}).pipe(Effect.provide(layer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect(error).toBeInstanceOf(BlockchainError);
				expect((error as BlockchainError)._tag).toBe("BlockchainError");
				expect((error as BlockchainError).message).toBe("Custom error");
			}
		});

		it("can catch errors by tag", async () => {
			const layer = mockBlockchain({
				getBlockByHash: () =>
					Effect.fail(new BlockchainError({ hash: "0x..." }, "Not found")),
			});

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const blockchain = yield* BlockchainService;
					return yield* blockchain.getBlockByHash("0x...");
				}).pipe(
					Effect.catchTag("BlockchainError", () => Effect.succeed("caught")),
					Effect.provide(layer),
				),
			);

			expect(result).toBe("caught");
		});
	});
});
