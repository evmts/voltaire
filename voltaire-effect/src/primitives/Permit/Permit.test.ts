import * as Schema from "effect/Schema";
import { describe, expect, it } from "vitest";
import * as Permit from "./index.js";

describe("Permit.Struct", () => {
	it("validates permit data", () => {
		const input = {
			owner: new Uint8Array(20).fill(1),
			spender: new Uint8Array(20).fill(2),
			value: 1000000000000000000n,
			nonce: 0n,
			deadline: 1700000000n,
		};
		const result = Schema.decodeSync(Permit.Struct)(input);
		expect(result.owner).toEqual(input.owner);
		expect(result.value).toBe(1000000000000000000n);
	});
});

describe("Permit.DomainStruct", () => {
	it("validates domain data", () => {
		const input = {
			name: "USD Coin",
			version: "2",
			chainId: 1n,
			verifyingContract: new Uint8Array(20).fill(0xab),
		};
		const result = Schema.decodeSync(Permit.DomainStruct)(input);
		expect(result.name).toBe("USD Coin");
		expect(result.chainId).toBe(1n);
	});
});
