/**
 * Type-level tests for EventStream module
 *
 * Tests that EventStream properly infers types from event definitions.
 */
import { describe, expectTypeOf, it } from "vitest";
// ============================================================================
// Test Event Definition
// ============================================================================
const transferEvent = {
    type: "event",
    name: "Transfer",
    inputs: [
        { type: "address", name: "from", indexed: true },
        { type: "address", name: "to", indexed: true },
        { type: "uint256", name: "value", indexed: false },
    ],
};
// ============================================================================
// EventStream Constructor Type Tests
// ============================================================================
describe("EventStream Constructor", () => {
    it("accepts provider, address, event, and optional filter", () => {
        expectTypeOf().toHaveProperty("provider");
        expectTypeOf().toHaveProperty("address");
        expectTypeOf().toHaveProperty("event");
    });
    it("address accepts hex string or AddressType", () => {
        expectTypeOf().toMatchTypeOf();
        expectTypeOf().toMatchTypeOf();
    });
    it("filter is optional", () => {
        // filter should be optional (can be undefined)
        expectTypeOf().toHaveProperty("filter");
    });
});
// ============================================================================
// EventStream Instance Type Tests
// ============================================================================
describe("EventStream Instance", () => {
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
// EventStreamResult Type Tests
// ============================================================================
describe("EventStreamResult", () => {
    it("has log property", () => {
        expectTypeOf().toHaveProperty("log");
    });
    it("has metadata property", () => {
        expectTypeOf().toHaveProperty("metadata");
    });
    it("log has eventName property", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("log has typed args", () => {
        expectTypeOf().toHaveProperty("from");
        expectTypeOf().toHaveProperty("to");
        expectTypeOf().toHaveProperty("value");
    });
    it("log.args.from is AddressType", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("log.args.value is bigint", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("log has blockNumber", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("log has blockHash", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("log has transactionHash", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("log has logIndex", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("metadata has chainHead as bigint", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("metadata has fromBlock as bigint", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("metadata has toBlock as bigint", () => {
        expectTypeOf().toEqualTypeOf();
    });
});
// ============================================================================
// Options Type Tests
// ============================================================================
describe("EventStreamOptions", () => {
    it("chunkSize is optional number", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("minChunkSize is optional number", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("pollingInterval is optional number", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("signal is optional AbortSignal", () => {
        expectTypeOf().toEqualTypeOf();
    });
});
describe("BackfillOptions", () => {
    it("extends EventStreamOptions", () => {
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
    it("extends EventStreamOptions", () => {
        expectTypeOf().toMatchTypeOf();
    });
    it("fromBlock is optional", () => {
        // fromBlock should be optional
        expectTypeOf().toEqualTypeOf();
    });
});
// ============================================================================
// Contract Integration Type Tests
// ============================================================================
describe("Contract.events integration", () => {
    it("placeholder for Contract integration tests", () => {
        // Tests that contract.events.Transfer({}) returns EventStream
        // Will be fully tested after ContractType.ts is updated
        expectTypeOf().toHaveProperty("backfill");
    });
});
