/**
 * Type-level tests for EventStream module
 *
 * Tests that EventStream properly infers types from event definitions.
 */

import { describe, expectTypeOf, it } from "vitest";
import type { AddressType } from "../primitives/Address/AddressType.js";
import type { TransactionHashType } from "../primitives/TransactionHash/TransactionHashType.js";
import type { BlockNumberType } from "../primitives/BlockNumber/BlockNumberType.js";
import type { HashType } from "../primitives/Hash/HashType.js";
import type { TypedProvider } from "../provider/TypedProvider.js";
import type {
	EventStream,
	EventStreamOptions,
	EventStreamResult,
	BackfillOptions,
	WatchOptions,
} from "./EventStreamType.js";
import { EventStream as EventStreamFactory } from "./EventStream.js";

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
} as const;

type TransferEvent = typeof transferEvent;

// ============================================================================
// EventStream Constructor Type Tests
// ============================================================================

describe("EventStream Constructor", () => {
	it("accepts provider, address, event, and optional filter", () => {
		// This tests that the factory function signature is correct
		type FactoryParams = Parameters<typeof EventStreamFactory>[0];

		expectTypeOf<FactoryParams>().toHaveProperty("provider");
		expectTypeOf<FactoryParams>().toHaveProperty("address");
		expectTypeOf<FactoryParams>().toHaveProperty("event");
	});

	it("address accepts hex string or AddressType", () => {
		type FactoryParams = Parameters<typeof EventStreamFactory>[0];
		type AddressParam = FactoryParams["address"];

		expectTypeOf<`0x${string}`>().toMatchTypeOf<AddressParam>();
		expectTypeOf<AddressType>().toMatchTypeOf<AddressParam>();
	});

	it("filter is optional", () => {
		type FactoryParams = Parameters<typeof EventStreamFactory>[0];

		// filter should be optional (can be undefined)
		expectTypeOf<FactoryParams>().toHaveProperty("filter");
	});
});

// ============================================================================
// EventStream Instance Type Tests
// ============================================================================

describe("EventStream Instance", () => {
	it("has backfill method", () => {
		type Stream = EventStream<TransferEvent>;
		expectTypeOf<Stream>().toHaveProperty("backfill");
	});

	it("has watch method", () => {
		type Stream = EventStream<TransferEvent>;
		expectTypeOf<Stream>().toHaveProperty("watch");
	});

	it("backfill returns AsyncGenerator", () => {
		type Stream = EventStream<TransferEvent>;
		type BackfillReturn = ReturnType<Stream["backfill"]>;

		expectTypeOf<BackfillReturn>().toMatchTypeOf<
			AsyncGenerator<unknown, unknown, unknown>
		>();
	});

	it("watch returns AsyncGenerator", () => {
		type Stream = EventStream<TransferEvent>;
		type WatchReturn = ReturnType<Stream["watch"]>;

		expectTypeOf<WatchReturn>().toMatchTypeOf<
			AsyncGenerator<unknown, unknown, unknown>
		>();
	});
});

// ============================================================================
// EventStreamResult Type Tests
// ============================================================================

describe("EventStreamResult", () => {
	it("has log property", () => {
		type Result = EventStreamResult<TransferEvent>;
		expectTypeOf<Result>().toHaveProperty("log");
	});

	it("has metadata property", () => {
		type Result = EventStreamResult<TransferEvent>;
		expectTypeOf<Result>().toHaveProperty("metadata");
	});

	it("log has eventName property", () => {
		type Result = EventStreamResult<TransferEvent>;
		expectTypeOf<Result["log"]["eventName"]>().toEqualTypeOf<"Transfer">();
	});

	it("log has typed args", () => {
		type Result = EventStreamResult<TransferEvent>;
		expectTypeOf<Result["log"]["args"]>().toHaveProperty("from");
		expectTypeOf<Result["log"]["args"]>().toHaveProperty("to");
		expectTypeOf<Result["log"]["args"]>().toHaveProperty("value");
	});

	it("log.args.from is AddressType", () => {
		type Result = EventStreamResult<TransferEvent>;
		expectTypeOf<Result["log"]["args"]["from"]>().toEqualTypeOf<AddressType>();
	});

	it("log.args.value is bigint", () => {
		type Result = EventStreamResult<TransferEvent>;
		expectTypeOf<Result["log"]["args"]["value"]>().toEqualTypeOf<bigint>();
	});

	it("log has blockNumber", () => {
		type Result = EventStreamResult<TransferEvent>;
		expectTypeOf<Result["log"]["blockNumber"]>().toEqualTypeOf<BlockNumberType>();
	});

	it("log has blockHash", () => {
		type Result = EventStreamResult<TransferEvent>;
		expectTypeOf<Result["log"]["blockHash"]>().toEqualTypeOf<HashType>();
	});

	it("log has transactionHash", () => {
		type Result = EventStreamResult<TransferEvent>;
		expectTypeOf<Result["log"]["transactionHash"]>().toEqualTypeOf<TransactionHashType>();
	});

	it("log has logIndex", () => {
		type Result = EventStreamResult<TransferEvent>;
		expectTypeOf<Result["log"]["logIndex"]>().toEqualTypeOf<number>();
	});

	it("metadata has currentBlock as bigint", () => {
		type Result = EventStreamResult<TransferEvent>;
		expectTypeOf<Result["metadata"]["currentBlock"]>().toEqualTypeOf<bigint>();
	});

	it("metadata has fromBlock as bigint", () => {
		type Result = EventStreamResult<TransferEvent>;
		expectTypeOf<Result["metadata"]["fromBlock"]>().toEqualTypeOf<bigint>();
	});

	it("metadata has toBlock as bigint", () => {
		type Result = EventStreamResult<TransferEvent>;
		expectTypeOf<Result["metadata"]["toBlock"]>().toEqualTypeOf<bigint>();
	});
});

// ============================================================================
// Options Type Tests
// ============================================================================

describe("EventStreamOptions", () => {
	it("chunkSize is optional number", () => {
		type Options = EventStreamOptions;
		expectTypeOf<Options["chunkSize"]>().toEqualTypeOf<number | undefined>();
	});

	it("minChunkSize is optional number", () => {
		type Options = EventStreamOptions;
		expectTypeOf<Options["minChunkSize"]>().toEqualTypeOf<number | undefined>();
	});

	it("pollingInterval is optional number", () => {
		type Options = EventStreamOptions;
		expectTypeOf<Options["pollingInterval"]>().toEqualTypeOf<
			number | undefined
		>();
	});

	it("signal is optional AbortSignal", () => {
		type Options = EventStreamOptions;
		expectTypeOf<Options["signal"]>().toEqualTypeOf<AbortSignal | undefined>();
	});
});

describe("BackfillOptions", () => {
	it("extends EventStreamOptions", () => {
		type Backfill = BackfillOptions;
		expectTypeOf<Backfill>().toMatchTypeOf<EventStreamOptions>();
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
	it("extends EventStreamOptions", () => {
		type Watch = WatchOptions;
		expectTypeOf<Watch>().toMatchTypeOf<EventStreamOptions>();
	});

	it("fromBlock is optional", () => {
		type Watch = WatchOptions;
		// fromBlock should be optional
		expectTypeOf<Watch["fromBlock"]>().toEqualTypeOf<bigint | undefined>();
	});
});

// ============================================================================
// Contract Integration Type Tests
// ============================================================================

describe("Contract.events integration", () => {
	it("placeholder for Contract integration tests", () => {
		// Tests that contract.events.Transfer({}) returns EventStream
		// Will be fully tested after ContractType.ts is updated
		expectTypeOf<EventStream<TransferEvent>>().toHaveProperty("backfill");
	});
});
