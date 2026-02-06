/**
 * Type-level tests for BlockStream module
 *
 * Tests that BlockStream properly infers types based on include level.
 */

import { describe, expectTypeOf, it } from "vitest";
import type { BlockType } from "../primitives/Block/BlockType.js";
import type { BlockHashType } from "../primitives/BlockHash/BlockHashType.js";
import type { TypedProvider } from "../provider/TypedProvider.js";
import type { BlockStream as BlockStreamFactory } from "./BlockStream.js";
import type {
	BackfillOptions,
	BlockInclude,
	BlockStream,
	BlockStreamEvent,
	BlockStreamMetadata,
	BlockStreamOptions,
	BlocksEvent,
	LightBlock,
	ReorgEvent,
	StreamBlock,
	WatchOptions,
} from "./BlockStreamType.js";

// ============================================================================
// BlockStream Constructor Type Tests
// ============================================================================

describe("BlockStream Constructor", () => {
	it("accepts provider", () => {
		type FactoryParams = Parameters<typeof BlockStreamFactory>[0];

		expectTypeOf<FactoryParams>().toHaveProperty("provider");
	});

	it("provider is TypedProvider", () => {
		type FactoryParams = Parameters<typeof BlockStreamFactory>[0];

		expectTypeOf<FactoryParams["provider"]>().toMatchTypeOf<TypedProvider>();
	});
});

// ============================================================================
// BlockStream Instance Type Tests
// ============================================================================

describe("BlockStream Instance", () => {
	it("has backfill method", () => {
		expectTypeOf<BlockStream>().toHaveProperty("backfill");
	});

	it("has watch method", () => {
		expectTypeOf<BlockStream>().toHaveProperty("watch");
	});

	it("backfill returns AsyncGenerator", () => {
		type BackfillReturn = ReturnType<BlockStream["backfill"]>;

		expectTypeOf<BackfillReturn>().toMatchTypeOf<
			AsyncGenerator<unknown, unknown, unknown>
		>();
	});

	it("watch returns AsyncGenerator", () => {
		type WatchReturn = ReturnType<BlockStream["watch"]>;

		expectTypeOf<WatchReturn>().toMatchTypeOf<
			AsyncGenerator<unknown, unknown, unknown>
		>();
	});
});

// ============================================================================
// BlockInclude Type Tests
// ============================================================================

describe("BlockInclude", () => {
	it("is union of header, transactions, receipts", () => {
		expectTypeOf<"header">().toMatchTypeOf<BlockInclude>();
		expectTypeOf<"transactions">().toMatchTypeOf<BlockInclude>();
		expectTypeOf<"receipts">().toMatchTypeOf<BlockInclude>();
	});

	it("does not accept invalid values", () => {
		// @ts-expect-error - invalid include value
		expectTypeOf<"invalid">().toMatchTypeOf<BlockInclude>();
	});
});

// ============================================================================
// LightBlock Type Tests
// ============================================================================

describe("LightBlock", () => {
	it("has number as bigint", () => {
		expectTypeOf<LightBlock["number"]>().toEqualTypeOf<bigint>();
	});

	it("has hash as BlockHashType", () => {
		expectTypeOf<LightBlock["hash"]>().toEqualTypeOf<BlockHashType>();
	});

	it("has parentHash as BlockHashType", () => {
		expectTypeOf<LightBlock["parentHash"]>().toEqualTypeOf<BlockHashType>();
	});

	it("has timestamp as bigint", () => {
		expectTypeOf<LightBlock["timestamp"]>().toEqualTypeOf<bigint>();
	});
});

// ============================================================================
// StreamBlock Type Tests
// ============================================================================

describe("StreamBlock", () => {
	it("header include returns block without full transactions", () => {
		type HeaderBlock = StreamBlock<"header">;
		// Should have body with transaction hashes only
		expectTypeOf<HeaderBlock>().toHaveProperty("body");
	});

	it("transactions include returns BlockType", () => {
		type TxBlock = StreamBlock<"transactions">;
		expectTypeOf<TxBlock>().toMatchTypeOf<BlockType>();
	});

	it("receipts include returns BlockType with receipts", () => {
		type ReceiptsBlock = StreamBlock<"receipts">;
		expectTypeOf<ReceiptsBlock>().toHaveProperty("receipts");
	});
});

// ============================================================================
// BlocksEvent Type Tests
// ============================================================================

describe("BlocksEvent", () => {
	it("has type blocks", () => {
		type Event = BlocksEvent<"header">;
		expectTypeOf<Event["type"]>().toEqualTypeOf<"blocks">();
	});

	it("has blocks array", () => {
		type Event = BlocksEvent<"header">;
		expectTypeOf<Event["blocks"]>().toMatchTypeOf<readonly unknown[]>();
	});

	it("has metadata", () => {
		type Event = BlocksEvent<"header">;
		expectTypeOf<Event>().toHaveProperty("metadata");
	});

	it("metadata has chainHead as bigint", () => {
		type Event = BlocksEvent<"header">;
		expectTypeOf<Event["metadata"]["chainHead"]>().toEqualTypeOf<bigint>();
	});
});

// ============================================================================
// ReorgEvent Type Tests
// ============================================================================

describe("ReorgEvent", () => {
	it("has type reorg", () => {
		type Event = ReorgEvent<"header">;
		expectTypeOf<Event["type"]>().toEqualTypeOf<"reorg">();
	});

	it("has removed as LightBlock array", () => {
		type Event = ReorgEvent<"header">;
		expectTypeOf<Event["removed"]>().toMatchTypeOf<readonly LightBlock[]>();
	});

	it("has added array", () => {
		type Event = ReorgEvent<"header">;
		expectTypeOf<Event["added"]>().toMatchTypeOf<readonly unknown[]>();
	});

	it("has commonAncestor as LightBlock", () => {
		type Event = ReorgEvent<"header">;
		expectTypeOf<Event["commonAncestor"]>().toMatchTypeOf<LightBlock>();
	});

	it("has metadata", () => {
		type Event = ReorgEvent<"header">;
		expectTypeOf<Event>().toHaveProperty("metadata");
	});
});

// ============================================================================
// BlockStreamEvent Discriminated Union Tests
// ============================================================================

describe("BlockStreamEvent", () => {
	it("is union of BlocksEvent and ReorgEvent", () => {
		type Event = BlockStreamEvent<"header">;

		// Should be able to narrow by type
		const _handleEvent = (event: Event) => {
			if (event.type === "blocks") {
				expectTypeOf(event).toMatchTypeOf<BlocksEvent<"header">>();
			} else {
				expectTypeOf(event).toMatchTypeOf<ReorgEvent<"header">>();
			}
		};
	});
});

// ============================================================================
// BlockStreamMetadata Type Tests
// ============================================================================

describe("BlockStreamMetadata", () => {
	it("has chainHead as bigint", () => {
		expectTypeOf<BlockStreamMetadata["chainHead"]>().toEqualTypeOf<bigint>();
	});
});

// ============================================================================
// Options Type Tests
// ============================================================================

describe("BlockStreamOptions", () => {
	it("include is optional BlockInclude", () => {
		type Options = BlockStreamOptions<BlockInclude>;
		expectTypeOf<Options["include"]>().toEqualTypeOf<
			BlockInclude | undefined
		>();
	});

	it("chunkSize is optional number", () => {
		type Options = BlockStreamOptions;
		expectTypeOf<Options["chunkSize"]>().toEqualTypeOf<number | undefined>();
	});

	it("minChunkSize is optional number", () => {
		type Options = BlockStreamOptions;
		expectTypeOf<Options["minChunkSize"]>().toEqualTypeOf<number | undefined>();
	});

	it("pollingInterval is optional number", () => {
		type Options = BlockStreamOptions;
		expectTypeOf<Options["pollingInterval"]>().toEqualTypeOf<
			number | undefined
		>();
	});

	it("maxQueuedBlocks is optional number", () => {
		type Options = BlockStreamOptions;
		expectTypeOf<Options["maxQueuedBlocks"]>().toEqualTypeOf<
			number | undefined
		>();
	});

	it("signal is optional AbortSignal", () => {
		type Options = BlockStreamOptions;
		expectTypeOf<Options["signal"]>().toEqualTypeOf<AbortSignal | undefined>();
	});
});

describe("BackfillOptions", () => {
	it("extends BlockStreamOptions", () => {
		type Backfill = BackfillOptions;
		expectTypeOf<Backfill>().toMatchTypeOf<BlockStreamOptions>();
	});

	it("requires fromBlock as bigint", () => {
		type Backfill = BackfillOptions;
		expectTypeOf<Backfill["fromBlock"]>().toEqualTypeOf<bigint>();
	});

	it("requires toBlock as bigint", () => {
		type Backfill = BackfillOptions;
		expectTypeOf<Backfill["toBlock"]>().toEqualTypeOf<bigint>();
	});
});

describe("WatchOptions", () => {
	it("extends BlockStreamOptions", () => {
		type Watch = WatchOptions;
		expectTypeOf<Watch>().toMatchTypeOf<BlockStreamOptions>();
	});

	it("fromBlock is optional", () => {
		type Watch = WatchOptions;
		expectTypeOf<Watch["fromBlock"]>().toEqualTypeOf<bigint | undefined>();
	});
});
