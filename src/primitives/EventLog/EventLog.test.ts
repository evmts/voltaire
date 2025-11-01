/**
 * Tests for EventLog module
 */

import { describe, it, expect } from "vitest";
import { EventLog } from "./EventLog/index.js";
import type { Address } from "./Address/index.js";
import type { Hash } from "./Hash/index.js";

// ============================================================================
// Test Data
// ============================================================================

const addr1 = "0x0000000000000000000000000000000000000001" as unknown as Address;
const addr2 = "0x0000000000000000000000000000000000000002" as unknown as Address;
const topic0 = "0x0000000000000000000000000000000000000000000000000000000000000010" as unknown as Hash;
const topic1 = "0x0000000000000000000000000000000000000000000000000000000000000011" as unknown as Hash;
const topic2 = "0x0000000000000000000000000000000000000000000000000000000000000012" as unknown as Hash;
const topic3 = "0x0000000000000000000000000000000000000000000000000000000000000013" as unknown as Hash;
const blockHash = "0x0000000000000000000000000000000000000000000000000000000000000100" as unknown as Hash;
const txHash = "0x0000000000000000000000000000000000000000000000000000000000000200" as unknown as Hash;

// ============================================================================
// Log Creation Tests
// ============================================================================

describe("EventLog.create", () => {
  it("creates log with required fields", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0, topic1],
      data: new Uint8Array([1, 2, 3]),
    });

    expect(log.address).toBe(addr1);
    expect(log.topics).toEqual([topic0, topic1]);
    expect(log.data).toEqual(new Uint8Array([1, 2, 3]));
    expect(log.removed).toBe(false);
  });

  it("creates log with all fields", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0],
      data: new Uint8Array([1]),
      blockNumber: 100n,
      transactionHash: txHash,
      transactionIndex: 5,
      blockHash: blockHash,
      logIndex: 10,
      removed: true,
    });

    expect(log.address).toBe(addr1);
    expect(log.blockNumber).toBe(100n);
    expect(log.transactionHash).toBe(txHash);
    expect(log.transactionIndex).toBe(5);
    expect(log.blockHash).toBe(blockHash);
    expect(log.logIndex).toBe(10);
    expect(log.removed).toBe(true);
  });

  it("creates log with empty topics", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [],
      data: new Uint8Array([]),
    });

    expect(log.topics).toEqual([]);
    expect(log.data).toEqual(new Uint8Array([]));
  });
});

// ============================================================================
// Topic Operations Tests
// ============================================================================

describe("EventLog.getTopic0", () => {
  it("returns topic0 from log", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0, topic1],
      data: new Uint8Array([]),
    });

    expect(EventLog.getTopic0(log)).toBe(topic0);
  });

  it("returns undefined for empty topics", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [],
      data: new Uint8Array([]),
    });

    expect(EventLog.getTopic0(log)).toBeUndefined();
  });
});

describe("EventLog.getSignature", () => {
  it("returns topic0 using this: pattern", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0, topic1],
      data: new Uint8Array([]),
    });

    expect(EventLog.getSignature.call(log)).toBe(topic0);
  });
});

describe("EventLog.getIndexedTopics", () => {
  it("returns indexed topics excluding topic0", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0, topic1, topic2, topic3],
      data: new Uint8Array([]),
    });

    expect(EventLog.getIndexedTopics(log)).toEqual([topic1, topic2, topic3]);
  });

  it("returns empty array when only topic0 present", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0],
      data: new Uint8Array([]),
    });

    expect(EventLog.getIndexedTopics(log)).toEqual([]);
  });

  it("returns empty array when no topics present", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [],
      data: new Uint8Array([]),
    });

    expect(EventLog.getIndexedTopics(log)).toEqual([]);
  });
});

describe("EventLog.getIndexed", () => {
  it("returns indexed topics using this: pattern", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0, topic1, topic2],
      data: new Uint8Array([]),
    });

    expect(EventLog.getIndexed.call(log)).toEqual([topic1, topic2]);
  });
});

// ============================================================================
// Topic Matching Tests
// ============================================================================

describe("EventLog.matchesTopics", () => {
  it("matches exact topics", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0, topic1, topic2],
      data: new Uint8Array([]),
    });

    expect(EventLog.matchesTopics(log, [topic0, topic1, topic2])).toBe(true);
  });

  it("matches with null wildcard", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0, topic1, topic2],
      data: new Uint8Array([]),
    });

    expect(EventLog.matchesTopics(log, [topic0, null, topic2])).toBe(true);
    expect(EventLog.matchesTopics(log, [null, topic1, null])).toBe(true);
  });

  it("matches with topic array (OR logic)", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0, topic1, topic2],
      data: new Uint8Array([]),
    });

    expect(EventLog.matchesTopics(log, [[topic0, topic1], topic1, topic2])).toBe(true);
    expect(EventLog.matchesTopics(log, [topic0, [topic1, topic3], topic2])).toBe(true);
  });

  it("fails when topic does not match", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0, topic1, topic2],
      data: new Uint8Array([]),
    });

    expect(EventLog.matchesTopics(log, [topic1, topic1, topic2])).toBe(false);
    expect(EventLog.matchesTopics(log, [topic0, topic2, topic2])).toBe(false);
  });

  it("fails when filter has more topics than log", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0, topic1],
      data: new Uint8Array([]),
    });

    expect(EventLog.matchesTopics(log, [topic0, topic1, topic2])).toBe(false);
  });

  it("succeeds when filter has fewer topics than log", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0, topic1, topic2],
      data: new Uint8Array([]),
    });

    expect(EventLog.matchesTopics(log, [topic0])).toBe(true);
    expect(EventLog.matchesTopics(log, [topic0, topic1])).toBe(true);
  });

  it("matches empty filter", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0, topic1],
      data: new Uint8Array([]),
    });

    expect(EventLog.matchesTopics(log, [])).toBe(true);
  });

  it("fails when topic array does not include log topic", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0, topic1, topic2],
      data: new Uint8Array([]),
    });

    expect(EventLog.matchesTopics(log, [topic0, [topic2, topic3], topic2])).toBe(false);
  });
});

describe("EventLog.matches", () => {
  it("matches topics using this: pattern", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0, topic1, topic2],
      data: new Uint8Array([]),
    });

    expect(EventLog.matches.call(log, [topic0, null, topic2])).toBe(true);
  });
});

// ============================================================================
// Address Matching Tests
// ============================================================================

describe("EventLog.matchesAddress", () => {
  it("matches single address", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0],
      data: new Uint8Array([]),
    });

    expect(EventLog.matchesAddress(log, addr1)).toBe(true);
    expect(EventLog.matchesAddress(log, addr2)).toBe(false);
  });

  it("matches address array (OR logic)", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0],
      data: new Uint8Array([]),
    });

    expect(EventLog.matchesAddress(log, [addr1, addr2])).toBe(true);
    expect(EventLog.matchesAddress(log, [addr2, addr1])).toBe(true);
    expect(EventLog.matchesAddress(log, [addr2])).toBe(false);
  });

  it("matches byte-wise for addresses", () => {
    const addrA = "0x0000000000000000000000000000000000000001" as unknown as Address;
    const addrB = "0x0000000000000000000000000000000000000001" as unknown as Address;

    const log = EventLog.create({
      address: addrA,
      topics: [topic0],
      data: new Uint8Array([]),
    });

    expect(EventLog.matchesAddress(log, addrB)).toBe(true);
  });
});

describe("EventLog.matchesAddr", () => {
  it("matches address using this: pattern", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0],
      data: new Uint8Array([]),
    });

    expect(EventLog.matchesAddr.call(log, addr1)).toBe(true);
    expect(EventLog.matchesAddr.call(log, [addr1, addr2])).toBe(true);
  });
});

// ============================================================================
// Complete Filter Matching Tests
// ============================================================================

describe("EventLog.matchesFilter", () => {
  it("matches filter with address only", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0],
      data: new Uint8Array([]),
    });

    expect(EventLog.matchesFilter(log, { address: addr1 })).toBe(true);
    expect(EventLog.matchesFilter(log, { address: addr2 })).toBe(false);
    expect(EventLog.matchesFilter(log, { address: [addr1, addr2] })).toBe(true);
  });

  it("matches filter with topics only", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0, topic1],
      data: new Uint8Array([]),
    });

    expect(EventLog.matchesFilter(log, { topics: [topic0, topic1] })).toBe(true);
    expect(EventLog.matchesFilter(log, { topics: [topic0, null] })).toBe(true);
    expect(EventLog.matchesFilter(log, { topics: [topic1] })).toBe(false);
  });

  it("matches filter with address and topics", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0, topic1],
      data: new Uint8Array([]),
    });

    expect(
      EventLog.matchesFilter(log, {
        address: addr1,
        topics: [topic0, topic1],
      }),
    ).toBe(true);

    expect(
      EventLog.matchesFilter(log, {
        address: addr2,
        topics: [topic0, topic1],
      }),
    ).toBe(false);

    expect(
      EventLog.matchesFilter(log, {
        address: addr1,
        topics: [topic1],
      }),
    ).toBe(false);
  });

  it("matches filter with block number range", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0],
      data: new Uint8Array([]),
      blockNumber: 100n,
    });

    expect(EventLog.matchesFilter(log, { fromBlock: 50n })).toBe(true);
    expect(EventLog.matchesFilter(log, { fromBlock: 100n })).toBe(true);
    expect(EventLog.matchesFilter(log, { fromBlock: 150n })).toBe(false);

    expect(EventLog.matchesFilter(log, { toBlock: 150n })).toBe(true);
    expect(EventLog.matchesFilter(log, { toBlock: 100n })).toBe(true);
    expect(EventLog.matchesFilter(log, { toBlock: 50n })).toBe(false);

    expect(EventLog.matchesFilter(log, { fromBlock: 50n, toBlock: 150n })).toBe(true);
    expect(EventLog.matchesFilter(log, { fromBlock: 100n, toBlock: 100n })).toBe(true);
    expect(EventLog.matchesFilter(log, { fromBlock: 101n, toBlock: 150n })).toBe(false);
  });

  it("matches filter with block hash", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0],
      data: new Uint8Array([]),
      blockHash: blockHash,
    });

    expect(EventLog.matchesFilter(log, { blockHash: blockHash })).toBe(true);
    expect(EventLog.matchesFilter(log, { blockHash: topic0 })).toBe(false);
  });

  it("ignores block number filter when log has no block number", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0],
      data: new Uint8Array([]),
    });

    expect(EventLog.matchesFilter(log, { fromBlock: 50n, toBlock: 150n })).toBe(true);
  });

  it("ignores block hash filter when log has no block hash", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0],
      data: new Uint8Array([]),
    });

    expect(EventLog.matchesFilter(log, { blockHash: blockHash })).toBe(true);
  });

  it("matches empty filter", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0],
      data: new Uint8Array([]),
    });

    expect(EventLog.matchesFilter(log, {})).toBe(true);
  });

  it("matches complex combined filter", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0, topic1, topic2],
      data: new Uint8Array([]),
      blockNumber: 100n,
      blockHash: blockHash,
    });

    expect(
      EventLog.matchesFilter(log, {
        address: [addr1, addr2],
        topics: [topic0, null, topic2],
        fromBlock: 50n,
        toBlock: 150n,
        blockHash: blockHash,
      }),
    ).toBe(true);
  });
});

describe("EventLog.matchesAll", () => {
  it("matches filter using this: pattern", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0, topic1],
      data: new Uint8Array([]),
      blockNumber: 100n,
    });

    expect(
      EventLog.matchesAll.call(log, {
        address: addr1,
        topics: [topic0],
        fromBlock: 50n,
      }),
    ).toBe(true);
  });
});

// ============================================================================
// Filtering Tests
// ============================================================================

describe("EventLog.filterLogs", () => {
  const logs = [
    EventLog.create({
      address: addr1,
      topics: [topic0, topic1],
      data: new Uint8Array([1]),
      blockNumber: 100n,
    }),
    EventLog.create({
      address: addr2,
      topics: [topic0, topic2],
      data: new Uint8Array([2]),
      blockNumber: 101n,
    }),
    EventLog.create({
      address: addr1,
      topics: [topic1, topic1],
      data: new Uint8Array([3]),
      blockNumber: 102n,
    }),
    EventLog.create({
      address: addr2,
      topics: [topic0, topic1],
      data: new Uint8Array([4]),
      blockNumber: 103n,
    }),
  ];

  it("filters by address", () => {
    const filtered = EventLog.filterLogs(logs, { address: addr1 });
    expect(filtered).toHaveLength(2);
    expect(filtered[0]!.data).toEqual(new Uint8Array([1]));
    expect(filtered[1]!.data).toEqual(new Uint8Array([3]));
  });

  it("filters by topics", () => {
    const filtered = EventLog.filterLogs(logs, { topics: [topic0] });
    expect(filtered).toHaveLength(3);
    expect(filtered[0]!.data).toEqual(new Uint8Array([1]));
    expect(filtered[1]!.data).toEqual(new Uint8Array([2]));
    expect(filtered[2]!.data).toEqual(new Uint8Array([4]));
  });

  it("filters by address and topics", () => {
    const filtered = EventLog.filterLogs(logs, {
      address: addr1,
      topics: [topic0],
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]!.data).toEqual(new Uint8Array([1]));
  });

  it("filters by block range", () => {
    const filtered = EventLog.filterLogs(logs, {
      fromBlock: 101n,
      toBlock: 102n,
    });
    expect(filtered).toHaveLength(2);
    expect(filtered[0]!.blockNumber).toBe(101n);
    expect(filtered[1]!.blockNumber).toBe(102n);
  });

  it("returns empty array when no matches", () => {
    const filtered = EventLog.filterLogs(logs, { topics: [topic3] });
    expect(filtered).toHaveLength(0);
  });

  it("returns all logs for empty filter", () => {
    const filtered = EventLog.filterLogs(logs, {});
    expect(filtered).toHaveLength(4);
  });
});

describe("EventLog.filter", () => {
  it("filters logs using this: pattern", () => {
    const logs = [
      EventLog.create({
        address: addr1,
        topics: [topic0],
        data: new Uint8Array([1]),
      }),
      EventLog.create({
        address: addr2,
        topics: [topic0],
        data: new Uint8Array([2]),
      }),
    ];

    const filtered = EventLog.filter.call(logs, { address: addr1 });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]!.address).toBe(addr1);
  });
});

// ============================================================================
// Sorting Tests
// ============================================================================

describe("EventLog.sortLogs", () => {
  it("sorts by block number ascending", () => {
    const logs = [
      EventLog.create({
        address: addr1,
        topics: [topic0],
        data: new Uint8Array([]),
        blockNumber: 103n,
      }),
      EventLog.create({
        address: addr1,
        topics: [topic0],
        data: new Uint8Array([]),
        blockNumber: 100n,
      }),
      EventLog.create({
        address: addr1,
        topics: [topic0],
        data: new Uint8Array([]),
        blockNumber: 101n,
      }),
    ];

    const sorted = EventLog.sortLogs(logs);
    expect(sorted[0]!.blockNumber).toBe(100n);
    expect(sorted[1]!.blockNumber).toBe(101n);
    expect(sorted[2]!.blockNumber).toBe(103n);
  });

  it("sorts by log index when block numbers are equal", () => {
    const logs = [
      EventLog.create({
        address: addr1,
        topics: [topic0],
        data: new Uint8Array([]),
        blockNumber: 100n,
        logIndex: 5,
      }),
      EventLog.create({
        address: addr1,
        topics: [topic0],
        data: new Uint8Array([]),
        blockNumber: 100n,
        logIndex: 2,
      }),
      EventLog.create({
        address: addr1,
        topics: [topic0],
        data: new Uint8Array([]),
        blockNumber: 100n,
        logIndex: 10,
      }),
    ];

    const sorted = EventLog.sortLogs(logs);
    expect(sorted[0]!.logIndex).toBe(2);
    expect(sorted[1]!.logIndex).toBe(5);
    expect(sorted[2]!.logIndex).toBe(10);
  });

  it("treats undefined block numbers as 0", () => {
    const logs = [
      EventLog.create({
        address: addr1,
        topics: [topic0],
        data: new Uint8Array([]),
        blockNumber: 100n,
      }),
      EventLog.create({
        address: addr1,
        topics: [topic0],
        data: new Uint8Array([]),
      }),
      EventLog.create({
        address: addr1,
        topics: [topic0],
        data: new Uint8Array([]),
        blockNumber: 50n,
      }),
    ];

    const sorted = EventLog.sortLogs(logs);
    expect(sorted[0]!.blockNumber).toBeUndefined();
    expect(sorted[1]!.blockNumber).toBe(50n);
    expect(sorted[2]!.blockNumber).toBe(100n);
  });

  it("treats undefined log indexes as 0", () => {
    const logs = [
      EventLog.create({
        address: addr1,
        topics: [topic0],
        data: new Uint8Array([]),
        blockNumber: 100n,
        logIndex: 5,
      }),
      EventLog.create({
        address: addr1,
        topics: [topic0],
        data: new Uint8Array([]),
        blockNumber: 100n,
      }),
      EventLog.create({
        address: addr1,
        topics: [topic0],
        data: new Uint8Array([]),
        blockNumber: 100n,
        logIndex: 2,
      }),
    ];

    const sorted = EventLog.sortLogs(logs);
    expect(sorted[0]!.logIndex).toBeUndefined();
    expect(sorted[1]!.logIndex).toBe(2);
    expect(sorted[2]!.logIndex).toBe(5);
  });

  it("does not mutate original array", () => {
    const logs = [
      EventLog.create({
        address: addr1,
        topics: [topic0],
        data: new Uint8Array([]),
        blockNumber: 103n,
      }),
      EventLog.create({
        address: addr1,
        topics: [topic0],
        data: new Uint8Array([]),
        blockNumber: 100n,
      }),
    ];

    const sorted = EventLog.sortLogs(logs);
    expect(logs[0]!.blockNumber).toBe(103n);
    expect(sorted[0]!.blockNumber).toBe(100n);
  });
});

describe("EventLog.sort", () => {
  it("sorts logs using this: pattern", () => {
    const logs = [
      EventLog.create({
        address: addr1,
        topics: [topic0],
        data: new Uint8Array([]),
        blockNumber: 103n,
      }),
      EventLog.create({
        address: addr1,
        topics: [topic0],
        data: new Uint8Array([]),
        blockNumber: 100n,
      }),
    ];

    const sorted = EventLog.sort.call(logs);
    expect(sorted[0]!.blockNumber).toBe(100n);
    expect(sorted[1]!.blockNumber).toBe(103n);
  });
});

// ============================================================================
// Removal Tests
// ============================================================================

describe("EventLog.isRemoved", () => {
  it("returns true for removed logs", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0],
      data: new Uint8Array([]),
      removed: true,
    });

    expect(EventLog.isRemoved(log)).toBe(true);
  });

  it("returns false for non-removed logs", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0],
      data: new Uint8Array([]),
      removed: false,
    });

    expect(EventLog.isRemoved(log)).toBe(false);
  });

  it("returns false when removed field is undefined", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0],
      data: new Uint8Array([]),
    });

    expect(EventLog.isRemoved(log)).toBe(false);
  });
});

describe("EventLog.wasRemoved", () => {
  it("returns removal status using this: pattern", () => {
    const removedLog = EventLog.create({
      address: addr1,
      topics: [topic0],
      data: new Uint8Array([]),
      removed: true,
    });

    const activeLog = EventLog.create({
      address: addr1,
      topics: [topic0],
      data: new Uint8Array([]),
    });

    expect(EventLog.wasRemoved.call(removedLog)).toBe(true);
    expect(EventLog.wasRemoved.call(activeLog)).toBe(false);
  });
});

// ============================================================================
// Clone Tests
// ============================================================================

describe("EventLog.clone", () => {
  it("creates deep copy of log", () => {
    const original = EventLog.create({
      address: addr1,
      topics: [topic0, topic1],
      data: new Uint8Array([1, 2, 3]),
      blockNumber: 100n,
      transactionHash: txHash,
      transactionIndex: 5,
      blockHash: blockHash,
      logIndex: 10,
      removed: true,
    });

    const cloned = EventLog.clone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.topics).not.toBe(original.topics);
    expect(cloned.data).not.toBe(original.data);
  });

  it("mutating clone does not affect original", () => {
    const original = EventLog.create({
      address: addr1,
      topics: [topic0],
      data: new Uint8Array([1, 2, 3]),
    });

    const cloned = EventLog.clone(original);
    cloned.data[0] = 99;

    expect(original.data[0]).toBe(1);
    expect(cloned.data[0]).toBe(99);
  });
});

describe("EventLog.copy", () => {
  it("clones log using this: pattern", () => {
    const original = EventLog.create({
      address: addr1,
      topics: [topic0, topic1],
      data: new Uint8Array([1, 2, 3]),
      blockNumber: 100n,
    });

    const copied = EventLog.copy.call(original);

    expect(copied).toEqual(original);
    expect(copied).not.toBe(original);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("EventLog edge cases", () => {
  it("handles log with empty data", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0],
      data: new Uint8Array([]),
    });

    expect(log.data).toEqual(new Uint8Array([]));
    expect(log.data.length).toBe(0);
  });

  it("handles log with many topics", () => {
    const manyTopics = [topic0, topic1, topic2, topic3];
    const log = EventLog.create({
      address: addr1,
      topics: manyTopics,
      data: new Uint8Array([]),
    });

    expect(log.topics).toEqual(manyTopics);
    expect(EventLog.getIndexedTopics(log)).toHaveLength(3);
  });

  it("handles filter with all null topics", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0, topic1, topic2],
      data: new Uint8Array([]),
    });

    expect(EventLog.matchesTopics(log, [null, null, null])).toBe(true);
  });

  it("handles very large block numbers", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0],
      data: new Uint8Array([]),
      blockNumber: 999999999999999n,
    });

    expect(
      EventLog.matchesFilter(log, {
        fromBlock: 999999999999998n,
        toBlock: 1000000000000000n,
      }),
    ).toBe(true);
  });

  it("handles zero block number", () => {
    const log = EventLog.create({
      address: addr1,
      topics: [topic0],
      data: new Uint8Array([]),
      blockNumber: 0n,
    });

    expect(EventLog.matchesFilter(log, { fromBlock: 0n, toBlock: 100n })).toBe(true);
  });

  it("preserves topic array readonly constraint", () => {
    const topics = [topic0, topic1] as const;
    const log = EventLog.create({
      address: addr1,
      topics: topics,
      data: new Uint8Array([]),
    });

    expect(log.topics).toEqual([topic0, topic1]);
  });
});
