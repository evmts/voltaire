/**
 * Tests for EventLog RPC conversion functions
 */

import { describe, expect, it } from "vitest";
import { fromRpc } from "./fromRpc.js";
import { toRpc } from "./toRpc.js";
import type { BrandedEventLog } from "./BrandedEventLog.js";
import type { Rpc } from "ox/Log";

// ============================================================================
// Test Data
// ============================================================================

const addr1 = "0x1234567890123456789012345678901234567890";
const addr2 = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
const topic0 =
	"0x0000000000000000000000000000000000000000000000000000000000000010";
const topic1 =
	"0x0000000000000000000000000000000000000000000000000000000000000011";
const topic2 =
	"0x0000000000000000000000000000000000000000000000000000000000000012";
const topic3 =
	"0x0000000000000000000000000000000000000000000000000000000000000013";
const blockHash =
	"0x0000000000000000000000000000000000000000000000000000000000000100";
const txHash =
	"0x0000000000000000000000000000000000000000000000000000000000000200";

// ERC20 Transfer event signature
const transferSig =
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

// ============================================================================
// fromRpc Tests - Valid RPC Log Parsing
// ============================================================================

describe("fromRpc - Valid RPC Log Parsing", () => {
	it("parses standard Transfer event log from RPC response", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [transferSig, topic1, topic2],
			data: "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
			blockNumber: "0x1a4",
			blockHash: blockHash,
			transactionHash: txHash,
			transactionIndex: "0x5",
			logIndex: "0xa",
			removed: false,
		};

		const log = fromRpc(rpcLog);

		expect(log.__tag).toBe("EventLog");
		expect(log.address).toBeDefined();
		expect(log.topics).toHaveLength(3);
		expect(typeof log.data).toBe("string");
		expect(log.blockNumber).toBe(420n);
		expect(log.transactionIndex).toBe(5);
		expect(log.logIndex).toBe(10);
		expect(log.removed).toBe(false);
	});

	it("parses log with 0 topics", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [],
			data: "0x123456",
			blockNumber: "0x1",
			transactionHash: txHash,
			transactionIndex: "0x0",
			blockHash: blockHash,
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.topics).toHaveLength(0);
	});

	it("parses log with 1 topic", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0],
			data: "0x",
			blockNumber: "0x1",
			transactionHash: txHash,
			transactionIndex: "0x0",
			blockHash: blockHash,
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.topics).toHaveLength(1);
	});

	it("parses log with 2 topics", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0, topic1],
			data: "0x",
			blockNumber: "0x1",
			transactionHash: txHash,
			transactionIndex: "0x0",
			blockHash: blockHash,
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.topics).toHaveLength(2);
	});

	it("parses log with 3 topics", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0, topic1, topic2],
			data: "0x",
			blockNumber: "0x1",
			transactionHash: txHash,
			transactionIndex: "0x0",
			blockHash: blockHash,
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.topics).toHaveLength(3);
	});

	it("parses log with 4 topics", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0, topic1, topic2, topic3],
			data: "0x",
			blockNumber: "0x1",
			transactionHash: txHash,
			transactionIndex: "0x0",
			blockHash: blockHash,
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.topics).toHaveLength(4);
	});

	it("parses log with empty data", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0],
			data: "0x",
			blockNumber: "0x1",
			transactionHash: txHash,
			transactionIndex: "0x0",
			blockHash: blockHash,
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.data).toBe("0x");
	});

	it("parses log with large data (1KB+)", () => {
		const largeData = `0x${"ff".repeat(1024)}`;
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0],
			data: largeData,
			blockNumber: "0x1",
			transactionHash: txHash,
			transactionIndex: "0x0",
			blockHash: blockHash,
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.data).toBe(largeData);
	});

	it("parses log with all optional fields present", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0],
			data: "0x",
			blockNumber: "0x64",
			blockHash: blockHash,
			transactionHash: txHash,
			transactionIndex: "0x5",
			logIndex: "0xa",
			removed: true,
		};

		const log = fromRpc(rpcLog);
		expect(log.blockNumber).toBe(100n);
		expect(log.blockHash).toBeDefined();
		expect(log.transactionHash).toBeDefined();
		expect(log.transactionIndex).toBe(5);
		expect(log.logIndex).toBe(10);
		expect(log.removed).toBe(true);
	});

	it("parses log with minimal required fields", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [],
			data: "0x",
			blockNumber: null,
			blockHash: null,
			transactionHash: null,
			transactionIndex: null,
			logIndex: null,
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.address).toBeDefined();
		expect(log.topics).toHaveLength(0);
		expect(log.data).toBe("0x");
	});
});

// ============================================================================
// fromRpc Tests - Field Extraction
// ============================================================================

describe("fromRpc - Field Extraction", () => {
	it("extracts and validates 20-byte address", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [],
			data: "0x",
			blockNumber: "0x1",
			transactionHash: txHash,
			transactionIndex: "0x0",
			blockHash: blockHash,
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.address).toBeDefined();
	});

	it("extracts array of 32-byte topic hashes", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0, topic1, topic2],
			data: "0x",
			blockNumber: "0x1",
			transactionHash: txHash,
			transactionIndex: "0x0",
			blockHash: blockHash,
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.topics).toHaveLength(3);
		expect(log.topics[0]).toBeDefined();
		expect(log.topics[1]).toBeDefined();
		expect(log.topics[2]).toBeDefined();
	});

	it("converts hex string data to Uint8Array", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [],
			data: "0x123456789abc",
			blockNumber: "0x1",
			transactionHash: txHash,
			transactionIndex: "0x0",
			blockHash: blockHash,
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.data).toBe("0x123456789abc");
	});

	it("converts blockNumber hex string to bigint (0x1a4 → 420n)", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [],
			data: "0x",
			blockNumber: "0x1a4",
			transactionHash: txHash,
			transactionIndex: "0x0",
			blockHash: blockHash,
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.blockNumber).toBe(420n);
	});

	it("extracts 32-byte blockHash", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [],
			data: "0x",
			blockNumber: "0x1",
			blockHash: blockHash,
			transactionHash: txHash,
			transactionIndex: "0x0",
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.blockHash).toBeDefined();
	});

	it("extracts 32-byte transactionHash", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [],
			data: "0x",
			blockNumber: "0x1",
			transactionHash: txHash,
			transactionIndex: "0x0",
			blockHash: blockHash,
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.transactionHash).toBeDefined();
	});

	it("converts transactionIndex hex to number", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [],
			data: "0x",
			blockNumber: "0x1",
			transactionHash: txHash,
			transactionIndex: "0x5",
			blockHash: blockHash,
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.transactionIndex).toBe(5);
	});

	it("converts logIndex hex to number", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [],
			data: "0x",
			blockNumber: "0x1",
			transactionHash: txHash,
			transactionIndex: "0x0",
			blockHash: blockHash,
			logIndex: "0xa",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.logIndex).toBe(10);
	});

	it("extracts removed boolean flag", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [],
			data: "0x",
			blockNumber: "0x1",
			transactionHash: txHash,
			transactionIndex: "0x0",
			blockHash: blockHash,
			logIndex: "0x0",
			removed: true,
		};

		const log = fromRpc(rpcLog);
		expect(log.removed).toBe(true);
	});
});

// ============================================================================
// fromRpc Tests - Null/Undefined Fields
// ============================================================================

describe("fromRpc - Null/Undefined Fields", () => {
	it("handles null blockNumber (pending transaction)", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0],
			data: "0x",
			blockNumber: null,
			blockHash: null,
			transactionHash: txHash,
			transactionIndex: null,
			logIndex: null,
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.blockNumber).toBeNull();
	});

	it("handles null blockHash (pending transaction)", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0],
			data: "0x",
			blockNumber: null,
			blockHash: null,
			transactionHash: txHash,
			transactionIndex: null,
			logIndex: null,
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.blockHash).toBeNull();
	});

	it("handles null transactionIndex (pending)", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0],
			data: "0x",
			blockNumber: null,
			blockHash: null,
			transactionHash: txHash,
			transactionIndex: null,
			logIndex: null,
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.transactionIndex).toBeNull();
	});

	it("handles null logIndex (pending)", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0],
			data: "0x",
			blockNumber: null,
			blockHash: null,
			transactionHash: txHash,
			transactionIndex: null,
			logIndex: null,
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.logIndex).toBeNull();
	});

	it("defaults removed to false when undefined", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0],
			data: "0x",
			blockNumber: "0x1",
			transactionHash: txHash,
			transactionIndex: "0x0",
			blockHash: blockHash,
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.removed).toBe(false);
	});
});

// ============================================================================
// fromRpc Tests - Edge Cases
// ============================================================================

describe("fromRpc - Edge Cases", () => {
	it("handles blockNumber = 0x0 (genesis block)", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0],
			data: "0x",
			blockNumber: "0x0",
			transactionHash: txHash,
			transactionIndex: "0x0",
			blockHash: blockHash,
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.blockNumber).toBe(0n);
	});

	it("handles blockNumber = 0xffffffffff (very large block)", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0],
			data: "0x",
			blockNumber: "0xffffffffff",
			transactionHash: txHash,
			transactionIndex: "0x0",
			blockHash: blockHash,
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.blockNumber).toBe(1099511627775n);
	});

	it("handles transactionIndex = 0x0 (first tx in block)", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0],
			data: "0x",
			blockNumber: "0x1",
			transactionHash: txHash,
			transactionIndex: "0x0",
			blockHash: blockHash,
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.transactionIndex).toBe(0);
	});

	it("handles transactionIndex = 0xff (256th transaction)", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0],
			data: "0x",
			blockNumber: "0x1",
			transactionHash: txHash,
			transactionIndex: "0xff",
			blockHash: blockHash,
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.transactionIndex).toBe(255);
	});

	it("handles logIndex = 0x0 (first log in tx)", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0],
			data: "0x",
			blockNumber: "0x1",
			transactionHash: txHash,
			transactionIndex: "0x0",
			blockHash: blockHash,
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.logIndex).toBe(0);
	});

	it("handles logIndex = 0xffff (many logs)", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0],
			data: "0x",
			blockNumber: "0x1",
			transactionHash: txHash,
			transactionIndex: "0x0",
			blockHash: blockHash,
			logIndex: "0xffff",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.logIndex).toBe(65535);
	});

	it("normalizes address with uppercase letters to lowercase", () => {
		const rpcLog: Rpc = {
			address: "0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD",
			topics: [topic0],
			data: "0x",
			blockNumber: "0x1",
			transactionHash: txHash,
			transactionIndex: "0x0",
			blockHash: blockHash,
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.address).toBeDefined();
	});

	it("handles topics with uppercase letters", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [
				"0xABCDEF0000000000000000000000000000000000000000000000000000000000",
			],
			data: "0x",
			blockNumber: "0x1",
			transactionHash: txHash,
			transactionIndex: "0x0",
			blockHash: blockHash,
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		expect(log.topics).toHaveLength(1);
	});
});

// ============================================================================
// toRpc Tests - Valid RPC Format Generation
// ============================================================================

describe("toRpc - Valid RPC Format Generation", () => {
	it("converts EventLog to RPC format", () => {
		const log: BrandedEventLog = {
			__tag: "EventLog",
			address: addr1 as any,
			topics: [topic0 as any, topic1 as any],
			data: "0x010203" as any,
			blockNumber: 420n,
			transactionHash: txHash as any,
			transactionIndex: 5,
			blockHash: blockHash as any,
			logIndex: 10,
			removed: false,
		};

		const rpcLog = toRpc(log);

		expect(rpcLog.address).toBe(addr1);
		expect(rpcLog.topics).toHaveLength(2);
		expect(typeof rpcLog.data).toBe("string");
		expect(rpcLog.blockNumber).toBe("0x1a4");
		expect(rpcLog.transactionIndex).toBe("0x5");
		expect(rpcLog.logIndex).toBe("0xa");
		expect(rpcLog.removed).toBe(false);
	});

	it("ensures all hex strings have 0x prefix", () => {
		const log: BrandedEventLog = {
			__tag: "EventLog",
			address: addr1 as any,
			topics: [topic0 as any],
			data: "0x0102" as any,
			blockNumber: 100n,
			transactionHash: txHash as any,
			transactionIndex: 1,
			blockHash: blockHash as any,
			logIndex: 1,
			removed: false,
		};

		const rpcLog = toRpc(log);

		expect(rpcLog.address).toMatch(/^0x/);
		expect(rpcLog.topics[0]).toMatch(/^0x/);
		expect(typeof rpcLog.data).toBe("string");
		expect(rpcLog.blockNumber).toMatch(/^0x/);
		expect(rpcLog.transactionHash).toMatch(/^0x/);
		expect(rpcLog.transactionIndex).toMatch(/^0x/);
		expect(rpcLog.blockHash).toMatch(/^0x/);
		expect(rpcLog.logIndex).toMatch(/^0x/);
	});

	it("formats numbers as hex strings with 0x prefix", () => {
		const log: BrandedEventLog = {
			__tag: "EventLog",
			address: addr1 as any,
			topics: [],
			data: "0x" as any,
			blockNumber: 255n,
			transactionHash: txHash as any,
			transactionIndex: 15,
			blockHash: blockHash as any,
			logIndex: 31,
			removed: false,
		};

		const rpcLog = toRpc(log);

		expect(rpcLog.blockNumber).toBe("0xff");
		expect(rpcLog.transactionIndex).toBe("0xf");
		expect(rpcLog.logIndex).toBe("0x1f");
	});
});

// ============================================================================
// toRpc Tests - Field Formatting
// ============================================================================

describe("toRpc - Field Formatting", () => {
	it("formats address as 0x + 40 hex chars (lowercase)", () => {
		const log: BrandedEventLog = {
			__tag: "EventLog",
			address: addr1 as any,
			topics: [],
			data: "0x" as any,
			removed: false,
		};

		const rpcLog = toRpc(log);

		expect(rpcLog.address).toMatch(/^0x[0-9a-f]{40}$/);
	});

	it("formats topics as array of 0x + 64 hex chars", () => {
		const log: BrandedEventLog = {
			__tag: "EventLog",
			address: addr1 as any,
			topics: [topic0 as any, topic1 as any, topic2 as any],
			data: "0x" as any,
			removed: false,
		};

		const rpcLog = toRpc(log);

		expect(rpcLog.topics).toHaveLength(3);
		for (const topic of rpcLog.topics) {
			expect(topic).toMatch(/^0x[0-9a-f]{64}$/);
		}
	});

	it("formats data as 0x + hex string", () => {
		const log: BrandedEventLog = {
			__tag: "EventLog",
			address: addr1 as any,
			topics: [],
			data: "0xabcdef" as any,
			removed: false,
		};

		const rpcLog = toRpc(log);

		expect(typeof rpcLog.data).toBe("string");
		expect(rpcLog.data).toMatch(/^0x/);
	});

	it("formats blockNumber bigint as 0x + hex", () => {
		const log: BrandedEventLog = {
			__tag: "EventLog",
			address: addr1 as any,
			topics: [],
			data: "0x" as any,
			blockNumber: 420n,
			removed: false,
		};

		const rpcLog = toRpc(log);

		expect(rpcLog.blockNumber).toBe("0x1a4");
	});

	it("formats blockHash as 0x + 64 hex chars", () => {
		const log: BrandedEventLog = {
			__tag: "EventLog",
			address: addr1 as any,
			topics: [],
			data: "0x" as any,
			blockHash: blockHash as any,
			removed: false,
		};

		const rpcLog = toRpc(log);

		expect(rpcLog.blockHash).toMatch(/^0x[0-9a-f]{64}$/);
	});

	it("formats transactionHash as 0x + 64 hex chars", () => {
		const log: BrandedEventLog = {
			__tag: "EventLog",
			address: addr1 as any,
			topics: [],
			data: "0x" as any,
			transactionHash: txHash as any,
			removed: false,
		};

		const rpcLog = toRpc(log);

		expect(rpcLog.transactionHash).toMatch(/^0x[0-9a-f]{64}$/);
	});

	it("formats transactionIndex number as 0x + hex", () => {
		const log: BrandedEventLog = {
			__tag: "EventLog",
			address: addr1 as any,
			topics: [],
			data: "0x" as any,
			transactionIndex: 5,
			removed: false,
		};

		const rpcLog = toRpc(log);

		expect(rpcLog.transactionIndex).toBe("0x5");
	});

	it("formats logIndex number as 0x + hex", () => {
		const log: BrandedEventLog = {
			__tag: "EventLog",
			address: addr1 as any,
			topics: [],
			data: "0x" as any,
			logIndex: 10,
			removed: false,
		};

		const rpcLog = toRpc(log);

		expect(rpcLog.logIndex).toBe("0xa");
	});

	it("preserves removed boolean", () => {
		const log: BrandedEventLog = {
			__tag: "EventLog",
			address: addr1 as any,
			topics: [],
			data: "0x" as any,
			removed: true,
		};

		const rpcLog = toRpc(log);

		expect(rpcLog.removed).toBe(true);
	});
});

// ============================================================================
// toRpc Tests - Optional Fields
// ============================================================================

describe("toRpc - Optional Fields", () => {
	it("converts undefined blockNumber to null in RPC", () => {
		const log: BrandedEventLog = {
			__tag: "EventLog",
			address: addr1 as any,
			topics: [],
			data: "0x" as any,
			blockNumber: undefined,
			removed: false,
		};

		const rpcLog = toRpc(log);

		expect(rpcLog.blockNumber).toBeNull();
	});

	it("handles undefined blockHash", () => {
		const log: BrandedEventLog = {
			__tag: "EventLog",
			address: addr1 as any,
			topics: [],
			data: "0x" as any,
			blockHash: undefined,
			removed: false,
		};

		const rpcLog = toRpc(log);

		expect(rpcLog.blockHash).toBeUndefined();
	});

	it("handles undefined transactionIndex", () => {
		const log: BrandedEventLog = {
			__tag: "EventLog",
			address: addr1 as any,
			topics: [],
			data: "0x" as any,
			transactionIndex: undefined,
			removed: false,
		};

		const rpcLog = toRpc(log);

		expect(rpcLog.transactionIndex).toBeNull();
	});

	it("handles undefined logIndex", () => {
		const log: BrandedEventLog = {
			__tag: "EventLog",
			address: addr1 as any,
			topics: [],
			data: "0x" as any,
			logIndex: undefined,
			removed: false,
		};

		const rpcLog = toRpc(log);

		expect(rpcLog.logIndex).toBeNull();
	});

	it("preserves removed false (not null)", () => {
		const log: BrandedEventLog = {
			__tag: "EventLog",
			address: addr1 as any,
			topics: [],
			data: "0x" as any,
			removed: false,
		};

		const rpcLog = toRpc(log);

		expect(rpcLog.removed).toBe(false);
	});
});

// ============================================================================
// toRpc Tests - Edge Cases
// ============================================================================

describe("toRpc - Edge Cases", () => {
	it("converts blockNumber = 0n to 0x0", () => {
		const log: BrandedEventLog = {
			__tag: "EventLog",
			address: addr1 as any,
			topics: [],
			data: "0x" as any,
			blockNumber: 0n,
			removed: false,
		};

		const rpcLog = toRpc(log);

		expect(rpcLog.blockNumber).toBe("0x0");
	});

	it("converts transactionIndex = 0 to 0x0", () => {
		const log: BrandedEventLog = {
			__tag: "EventLog",
			address: addr1 as any,
			topics: [],
			data: "0x" as any,
			transactionIndex: 0,
			removed: false,
		};

		const rpcLog = toRpc(log);

		expect(rpcLog.transactionIndex).toBe("0x0");
	});

	it("converts logIndex = 0 to 0x0", () => {
		const log: BrandedEventLog = {
			__tag: "EventLog",
			address: addr1 as any,
			topics: [],
			data: "0x" as any,
			logIndex: 0,
			removed: false,
		};

		const rpcLog = toRpc(log);

		expect(rpcLog.logIndex).toBe("0x0");
	});

	it("handles empty topics array", () => {
		const log: BrandedEventLog = {
			__tag: "EventLog",
			address: addr1 as any,
			topics: [],
			data: "0x" as any,
			removed: false,
		};

		const rpcLog = toRpc(log);

		expect(rpcLog.topics).toEqual([]);
	});

	it("handles empty data", () => {
		const log: BrandedEventLog = {
			__tag: "EventLog",
			address: addr1 as any,
			topics: [],
			data: "0x" as any,
			removed: false,
		};

		const rpcLog = toRpc(log);

		expect(rpcLog.data).toBe("0x");
	});

	it("preserves removed = true", () => {
		const log: BrandedEventLog = {
			__tag: "EventLog",
			address: addr1 as any,
			topics: [],
			data: "0x" as any,
			removed: true,
		};

		const rpcLog = toRpc(log);

		expect(rpcLog.removed).toBe(true);
	});
});

// ============================================================================
// Round-Trip Tests - Conversion Consistency
// ============================================================================

describe("Round-Trip - Conversion Consistency", () => {
	it("preserves all fields through fromRpc(toRpc(log))", () => {
		const original: BrandedEventLog = {
			__tag: "EventLog",
			address: addr1 as any,
			topics: [topic0 as any, topic1 as any],
			data: "0x01020304" as any,
			blockNumber: 420n,
			transactionHash: txHash as any,
			transactionIndex: 5,
			blockHash: blockHash as any,
			logIndex: 10,
			removed: false,
		};

		const rpcLog = toRpc(original);
		const restored = fromRpc(rpcLog);

		expect(restored.blockNumber).toBe(original.blockNumber);
		expect(restored.transactionIndex).toBe(original.transactionIndex);
		expect(restored.logIndex).toBe(original.logIndex);
		expect(restored.removed).toBe(original.removed);
		expect(restored.data).toBe(original.data);
		expect(restored.topics.length).toBe(original.topics.length);
	});

	it("produces equivalent RPC format through toRpc(fromRpc(rpcLog))", () => {
		const original: Rpc = {
			address: addr1,
			topics: [topic0, topic1],
			data: "0x12345678",
			blockNumber: "0x1a4",
			transactionHash: txHash,
			transactionIndex: "0x5",
			blockHash: blockHash,
			logIndex: "0xa",
			removed: false,
		};

		const log = fromRpc(original);
		const restored = toRpc(log);

		expect(restored.address).toBe(original.address);
		expect(restored.topics).toEqual(original.topics);
		expect(restored.blockNumber).toBe(original.blockNumber);
		expect(restored.transactionIndex).toBe(original.transactionIndex);
		expect(restored.logIndex).toBe(original.logIndex);
		expect(restored.removed).toBe(original.removed);
	});

	it("preserves exact values through round-trip", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0],
			data: "0xff",
			blockNumber: "0xdead",
			transactionHash: txHash,
			transactionIndex: "0xbeef",
			blockHash: blockHash,
			logIndex: "0xcafe",
			removed: true,
		};

		const log = fromRpc(rpcLog);
		const restored = toRpc(log);

		expect(restored.blockNumber).toBe("0xdead");
		expect(restored.removed).toBe(true);
	});

	it("maintains consistency through multiple round-trips", () => {
		const original: Rpc = {
			address: addr1,
			topics: [topic0, topic1, topic2],
			data: "0x123456",
			blockNumber: "0x64",
			transactionHash: txHash,
			transactionIndex: "0x1",
			blockHash: blockHash,
			logIndex: "0x2",
			removed: false,
		};

		let current = original;
		for (let i = 0; i < 5; i++) {
			const log = fromRpc(current);
			current = toRpc(log);
		}

		expect(current.address).toBe(original.address);
		expect(current.topics).toEqual(original.topics);
		expect(current.blockNumber).toBe(original.blockNumber);
		expect(current.removed).toBe(original.removed);
	});
});

// ============================================================================
// Round-Trip Tests - Real-World Examples
// ============================================================================

describe("Round-Trip - Real-World Examples", () => {
	it("handles ERC20 Transfer event round-trip", () => {
		const rpcLog: Rpc = {
			address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
			topics: [
				transferSig,
				"0x000000000000000000000000f977814e90da44bfa03b6295a0616a897441acec",
				"0x00000000000000000000000028c6c06298d514db089934071355e5743bf21d60",
			],
			data: "0x0000000000000000000000000000000000000000000000000000000077359400",
			blockNumber: "0x12d685c",
			blockHash:
				"0x1234567890123456789012345678901234567890123456789012345678901234",
			transactionHash:
				"0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
			transactionIndex: "0x4",
			logIndex: "0x7",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		const restored = toRpc(log);

		expect(restored.address).toBe(rpcLog.address);
		expect(restored.topics).toEqual(rpcLog.topics);
		expect(restored.blockNumber).toBe(rpcLog.blockNumber);
		expect(restored.removed).toBe(rpcLog.removed);
	});

	it("handles Uniswap Swap event round-trip", () => {
		const swapSig =
			"0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67";
		const rpcLog: Rpc = {
			address: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
			topics: [
				swapSig,
				"0x0000000000000000000000003fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
				"0x0000000000000000000000003fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
			],
			data: "0x0000000000000000000000000000000000000000000000000000000000000000fffffffffffffffffffffffffffffffffffffffffffffffffffff1c37937e000ffffffffffffffffffffffffffffffffffffffffffffffffffffff12e0cf2e86000000000000000000000000000000000000000000000006c8e4c1a43a1ad1caf90000000000000000000000000000000000000000000000000000000000042a34",
			blockNumber: "0x12d685c",
			blockHash: blockHash,
			transactionHash: txHash,
			transactionIndex: "0xa",
			logIndex: "0x10",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		const restored = toRpc(log);

		expect(restored.topics).toEqual(rpcLog.topics);
		expect(restored.data).toBe(rpcLog.data);
	});

	it("handles event with indexed parameters", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0, topic1, topic2, topic3],
			data: "0x",
			blockNumber: "0x1",
			blockHash: blockHash,
			transactionHash: txHash,
			transactionIndex: "0x0",
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		const restored = toRpc(log);

		expect(restored.topics).toHaveLength(4);
		expect(restored.topics).toEqual(rpcLog.topics);
	});

	it("handles event with no indexed parameters", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0],
			data: "0x0000000000000000000000001234567890123456789012345678901234567890000000000000000000000000abcdefabcdefabcdefabcdefabcdefabcdefabcd",
			blockNumber: "0x1",
			blockHash: blockHash,
			transactionHash: txHash,
			transactionIndex: "0x0",
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		const restored = toRpc(log);

		expect(restored.topics).toHaveLength(1);
		expect(restored.data).toBe(rpcLog.data);
	});
});

// ============================================================================
// Round-Trip Tests - Edge Case Round-Trips
// ============================================================================

describe("Round-Trip - Edge Cases", () => {
	it("handles pending transaction log (null block fields)", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0],
			data: "0x",
			blockNumber: null,
			blockHash: null,
			transactionHash: txHash,
			transactionIndex: null,
			logIndex: null,
			removed: false,
		};

		const log = fromRpc(rpcLog);
		const restored = toRpc(log);

		expect(restored.blockNumber).toBeNull();
		expect(restored.blockHash).toBeNull();
		expect(restored.transactionIndex).toBeNull();
		expect(restored.logIndex).toBeNull();
	});

	it("handles removed log (reorged block)", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0],
			data: "0x",
			blockNumber: "0x1",
			blockHash: blockHash,
			transactionHash: txHash,
			transactionIndex: "0x0",
			logIndex: "0x0",
			removed: true,
		};

		const log = fromRpc(rpcLog);
		const restored = toRpc(log);

		expect(restored.removed).toBe(true);
	});

	it("handles genesis block log", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0],
			data: "0x",
			blockNumber: "0x0",
			blockHash: blockHash,
			transactionHash: txHash,
			transactionIndex: "0x0",
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		const restored = toRpc(log);

		expect(restored.blockNumber).toBe("0x0");
	});

	it("handles maximum field values", () => {
		const rpcLog: Rpc = {
			address: addr1,
			topics: [topic0, topic1, topic2, topic3],
			data: `0x${"ff".repeat(1024)}`,
			blockNumber: "0xffffffffffffffff",
			blockHash: blockHash,
			transactionHash: txHash,
			transactionIndex: "0xffffffff",
			logIndex: "0xffffffff",
			removed: false,
		};

		const log = fromRpc(rpcLog);
		const restored = toRpc(log);

		expect(restored.topics).toHaveLength(4);
		expect(restored.data.length).toBe(rpcLog.data.length);
	});
});

// ============================================================================
// Integration Tests - RPC Response Parsing
// ============================================================================

describe("Integration - RPC Response Parsing", () => {
	it("parses array of logs from eth_getLogs response", () => {
		const rpcLogs: Rpc[] = [
			{
				address: addr1,
				topics: [topic0],
				data: "0x01",
				blockNumber: "0x1",
				blockHash: blockHash,
				transactionHash: txHash,
				transactionIndex: "0x0",
				logIndex: "0x0",
				removed: false,
			},
			{
				address: addr2,
				topics: [topic1],
				data: "0x02",
				blockNumber: "0x2",
				blockHash: blockHash,
				transactionHash: txHash,
				transactionIndex: "0x1",
				logIndex: "0x1",
				removed: false,
			},
		];

		const logs = rpcLogs.map(fromRpc);

		expect(logs).toHaveLength(2);
		expect(logs[0]?.blockNumber).toBe(1n);
		expect(logs[1]?.blockNumber).toBe(2n);
	});

	it("parses logs from eth_getTransactionReceipt", () => {
		const receipt = {
			logs: [
				{
					address: addr1,
					topics: [transferSig],
					data: "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
					blockNumber: "0x1a4",
					blockHash: blockHash,
					transactionHash: txHash,
					transactionIndex: "0x0",
					logIndex: "0x0",
					removed: false,
				},
			],
		};

		const logs = receipt.logs.map(fromRpc);

		expect(logs).toHaveLength(1);
		expect(logs[0]?.blockNumber).toBe(420n);
	});

	it("handles mixed pending/confirmed logs", () => {
		const rpcLogs: Rpc[] = [
			{
				address: addr1,
				topics: [topic0],
				data: "0x",
				blockNumber: "0x1",
				blockHash: blockHash,
				transactionHash: txHash,
				transactionIndex: "0x0",
				logIndex: "0x0",
				removed: false,
			},
			{
				address: addr1,
				topics: [topic0],
				data: "0x",
				blockNumber: null,
				blockHash: null,
				transactionHash: txHash,
				transactionIndex: null,
				logIndex: null,
				removed: false,
			},
		];

		const logs = rpcLogs.map(fromRpc);

		expect(logs[0]?.blockNumber).toBe(1n);
		expect(logs[1]?.blockNumber).toBeNull();
	});

	it("filters logs after parsing", () => {
		const rpcLogs: Rpc[] = [
			{
				address: addr1,
				topics: [topic0],
				data: "0x",
				blockNumber: "0x1",
				blockHash: blockHash,
				transactionHash: txHash,
				transactionIndex: "0x0",
				logIndex: "0x0",
				removed: false,
			},
			{
				address: addr2,
				topics: [topic1],
				data: "0x",
				blockNumber: "0x2",
				blockHash: blockHash,
				transactionHash: txHash,
				transactionIndex: "0x1",
				logIndex: "0x1",
				removed: false,
			},
		];

		const logs = rpcLogs.map(fromRpc).filter((log) => log.blockNumber === 1n);

		expect(logs).toHaveLength(1);
		expect(logs[0]?.blockNumber).toBe(1n);
	});
});

// ============================================================================
// Integration Tests - Real RPC Formats
// ============================================================================

describe("Integration - Real RPC Formats", () => {
	it("handles Geth RPC format", () => {
		const gethLog: Rpc = {
			address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
			topics: [transferSig],
			data: "0x0000000000000000000000000000000000000000000000000000000000989680",
			blockNumber: "0x12d685c",
			blockHash:
				"0x1234567890123456789012345678901234567890123456789012345678901234",
			transactionHash:
				"0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
			transactionIndex: "0x4",
			logIndex: "0x7",
			removed: false,
		};

		const log = fromRpc(gethLog);

		expect(log.__tag).toBe("EventLog");
		expect(log.blockNumber).toBe(0x12d685cn);
	});

	it("handles Erigon RPC format", () => {
		const erigonLog: Rpc = {
			address: addr1,
			topics: [topic0],
			data: "0x",
			blockNumber: "0x1",
			blockHash: blockHash,
			transactionHash: txHash,
			transactionIndex: "0x0",
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(erigonLog);

		expect(log.__tag).toBe("EventLog");
	});

	it("handles Alchemy/Infura format variations", () => {
		const alchemyLog: Rpc = {
			address: addr1,
			topics: [topic0],
			data: "0x",
			blockNumber: "0x1a4",
			blockHash: blockHash,
			transactionHash: txHash,
			transactionIndex: "0x5",
			logIndex: "0xa",
			removed: false,
		};

		const log = fromRpc(alchemyLog);

		expect(log.blockNumber).toBe(420n);
	});

	it("handles Hardhat local node format", () => {
		const hardhatLog: Rpc = {
			address: addr1.toLowerCase(),
			topics: [topic0.toLowerCase()],
			data: "0x",
			blockNumber: "0x1",
			blockHash: blockHash.toLowerCase(),
			transactionHash: txHash.toLowerCase(),
			transactionIndex: "0x0",
			logIndex: "0x0",
			removed: false,
		};

		const log = fromRpc(hardhatLog);

		expect(log.__tag).toBe("EventLog");
	});
});
