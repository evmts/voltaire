import { describe, expect, it } from "vitest";
import { InvalidFormatError } from "../errors/index.js";
import { fromRpc } from "./fromRpc.js";

const HASH = `0x${"ab".repeat(32)}`;
const LEGACY = {
	type: "0x0",
	nonce: "0x1",
	gasPrice: "0x4a817c800",
	gas: "0x5208",
	to: `0x${"12".repeat(20)}`,
	value: "0xde0b6b3a7640000",
	input: "0xabcd",
	v: "0x1b",
	r: `0x${"11".repeat(32)}`,
	s: `0x${"22".repeat(32)}`,
};

describe("BlockBody.fromRpc hash-only bodies", () => {
	it("throws a clear error instead of fabricating a legacy transaction", () => {
		// eth_getBlockByNumber(block, false) returns transaction hashes.
		const rpc = { transactions: [HASH], uncles: [] } as unknown as Parameters<
			typeof fromRpc
		>[0];
		expect(() => fromRpc(rpc)).toThrow(InvalidFormatError);
		expect(() => fromRpc(rpc)).toThrow(/full transaction objects/);
	});

	it("reports the index of the first hash in a mixed list", () => {
		const rpc = {
			transactions: [LEGACY, HASH],
			uncles: [],
		} as unknown as Parameters<typeof fromRpc>[0];
		try {
			fromRpc(rpc);
			expect.fail("Expected to throw");
		} catch (e) {
			expect(e).toBeInstanceOf(InvalidFormatError);
			expect((e as InvalidFormatError).context).toMatchObject({ index: 1 });
		}
	});

	it("still decodes full transaction objects", () => {
		const body = fromRpc({ transactions: [LEGACY], uncles: [] });
		expect(body.transactions).toHaveLength(1);
		expect(body.transactions[0]).toMatchObject({ nonce: 1n, v: 27n });
	});
});
