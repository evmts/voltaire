import * as Schema from "effect/Schema";
import { describe, expect, it } from "vitest";
import * as LogFilter from "./index.js";

describe("LogFilter.Rpc", () => {
	it("validates filter with block range", () => {
		const input = {
			fromBlock: 1000000n,
			toBlock: 1000100n,
		};
		const result = Schema.decodeSync(LogFilter.Rpc)(input);
		expect(result.fromBlock).toBe(1000000n);
		expect(result.toBlock).toBe(1000100n);
	});

	it("validates filter with block tags", () => {
		const input = {
			fromBlock: "latest" as const,
		};
		const result = Schema.decodeSync(LogFilter.Rpc)(input);
		expect(result.fromBlock).toBe("latest");
	});

	it("validates filter with address", () => {
		const input = {
			address: "0x1234567890123456789012345678901234567890",
		};
		const result = Schema.decodeSync(LogFilter.Rpc)(input);
		expect(result.address).toBeInstanceOf(Uint8Array);
	});
});
