import { describe, expect, it } from "@effect/vitest";
import * as Schema from "effect/Schema";
import * as TopicFilter from "./index.js";

describe("TopicFilter.Rpc", () => {
	it("validates topic filter array", () => {
		const input = [
			new Uint8Array(32).fill(0xab),
			null,
			[new Uint8Array(32).fill(0xcd), new Uint8Array(32).fill(0xef)],
		];
		const result = Schema.decodeSync(TopicFilter.Rpc)(input);
		expect(Array.isArray(result)).toBe(true);
	});

	it("encodes back to array", () => {
		const input = [new Uint8Array(32).fill(0xab)];
		const decoded = Schema.decodeSync(TopicFilter.Rpc)(input);
		const encoded = Schema.encodeSync(TopicFilter.Rpc)(decoded);
		expect(Array.isArray(encoded)).toBe(true);
	});
});
