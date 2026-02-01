/**
 * Type-level tests for BlockStream module
 *
 * Tests that BlockStream properly infers types based on include level.
 */
import { describe, expectTypeOf, it } from "vitest";
// ============================================================================
// BlockStream Constructor Type Tests
// ============================================================================
describe("BlockStream Constructor", () => {
    it("accepts provider", () => {
        expectTypeOf().toHaveProperty("provider");
    });
    it("provider is TypedProvider", () => {
        expectTypeOf().toMatchTypeOf();
    });
});
// ============================================================================
// BlockStream Instance Type Tests
// ============================================================================
describe("BlockStream Instance", () => {
    it("has backfill method", () => {
        expectTypeOf().toHaveProperty("backfill");
    });
    it("has watch method", () => {
        expectTypeOf().toHaveProperty("watch");
    });
    it("backfill returns AsyncGenerator", () => {
        expectTypeOf().toMatchTypeOf();
    });
    it("watch returns AsyncGenerator", () => {
        expectTypeOf().toMatchTypeOf();
    });
});
// ============================================================================
// BlockInclude Type Tests
// ============================================================================
describe("BlockInclude", () => {
    it("is union of header, transactions, receipts", () => {
        expectTypeOf().toMatchTypeOf();
        expectTypeOf().toMatchTypeOf();
        expectTypeOf().toMatchTypeOf();
    });
    it("does not accept invalid values", () => {
        // @ts-expect-error - invalid include value
        expectTypeOf().toMatchTypeOf();
    });
});
// ============================================================================
// LightBlock Type Tests
// ============================================================================
describe("LightBlock", () => {
    it("has number as bigint", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("has hash as BlockHashType", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("has parentHash as BlockHashType", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("has timestamp as bigint", () => {
        expectTypeOf().toEqualTypeOf();
    });
});
// ============================================================================
// StreamBlock Type Tests
// ============================================================================
describe("StreamBlock", () => {
    it("header include returns block without full transactions", () => {
        // Should have body with transaction hashes only
        expectTypeOf().toHaveProperty("body");
    });
    it("transactions include returns BlockType", () => {
        expectTypeOf().toMatchTypeOf();
    });
    it("receipts include returns BlockType with receipts", () => {
        expectTypeOf().toHaveProperty("receipts");
    });
});
// ============================================================================
// BlocksEvent Type Tests
// ============================================================================
describe("BlocksEvent", () => {
    it("has type blocks", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("has blocks array", () => {
        expectTypeOf().toMatchTypeOf();
    });
    it("has metadata", () => {
        expectTypeOf().toHaveProperty("metadata");
    });
    it("metadata has chainHead as bigint", () => {
        expectTypeOf().toEqualTypeOf();
    });
});
// ============================================================================
// ReorgEvent Type Tests
// ============================================================================
describe("ReorgEvent", () => {
    it("has type reorg", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("has removed as LightBlock array", () => {
        expectTypeOf().toMatchTypeOf();
    });
    it("has added array", () => {
        expectTypeOf().toMatchTypeOf();
    });
    it("has commonAncestor as LightBlock", () => {
        expectTypeOf().toMatchTypeOf();
    });
    it("has metadata", () => {
        expectTypeOf().toHaveProperty("metadata");
    });
});
// ============================================================================
// BlockStreamEvent Discriminated Union Tests
// ============================================================================
describe("BlockStreamEvent", () => {
    it("is union of BlocksEvent and ReorgEvent", () => {
        // Should be able to narrow by type
        const _handleEvent = (event) => {
            if (event.type === "blocks") {
                expectTypeOf(event).toMatchTypeOf();
            }
            else {
                expectTypeOf(event).toMatchTypeOf();
            }
        };
    });
});
// ============================================================================
// BlockStreamMetadata Type Tests
// ============================================================================
describe("BlockStreamMetadata", () => {
    it("has chainHead as bigint", () => {
        expectTypeOf().toEqualTypeOf();
    });
});
// ============================================================================
// Options Type Tests
// ============================================================================
describe("BlockStreamOptions", () => {
    it("include is optional BlockInclude", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("chunkSize is optional number", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("minChunkSize is optional number", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("pollingInterval is optional number", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("maxQueuedBlocks is optional number", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("signal is optional AbortSignal", () => {
        expectTypeOf().toEqualTypeOf();
    });
});
describe("BackfillOptions", () => {
    it("extends BlockStreamOptions", () => {
        expectTypeOf().toMatchTypeOf();
    });
    it("requires fromBlock as bigint", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("requires toBlock as bigint", () => {
        expectTypeOf().toEqualTypeOf();
    });
});
describe("WatchOptions", () => {
    it("extends BlockStreamOptions", () => {
        expectTypeOf().toMatchTypeOf();
    });
    it("fromBlock is optional", () => {
        expectTypeOf().toEqualTypeOf();
    });
});
