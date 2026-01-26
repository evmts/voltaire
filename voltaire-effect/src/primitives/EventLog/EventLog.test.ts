import * as Schema from "effect/Schema";
import { describe, expect, it } from "@effect/vitest";
import * as EventLog from "./index.js";

describe("EventLog.Rpc", () => {
	it("validates event log structure", () => {
		const input = {
			address: "0x1234567890123456789012345678901234567890",
			topics: [`0x${"ab".repeat(32)}`, `0x${"cd".repeat(32)}`],
			data: new Uint8Array(32).fill(0xff),
			blockNumber: 12345678n,
			logIndex: 0,
		};
		const result = Schema.decodeSync(EventLog.Rpc)(input);
		expect(result.address).toBeInstanceOf(Uint8Array);
		expect(result.topics.length).toBe(2);
		expect(result.data).toBeInstanceOf(Uint8Array);
	});

	it("rejects logs with more than 4 topics", () => {
		const input = {
			address: "0x1234567890123456789012345678901234567890",
			topics: Array.from({ length: 5 }, () => `0x${"ab".repeat(32)}`),
			data: new Uint8Array(0),
		};
		expect(() => Schema.decodeSync(EventLog.Rpc)(input)).toThrow();
	});
});
