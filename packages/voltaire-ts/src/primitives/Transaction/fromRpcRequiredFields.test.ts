import { describe, expect, it } from "vitest";
import { InvalidFormatError, InvalidLengthError } from "../errors/index.js";
import { fromRpc } from "./fromRpc.js";
import { Type } from "./types.js";

type Rpc = Parameters<typeof fromRpc>[0];

const ADDRESS = `0x${"12".repeat(20)}`;
const HASH = `0x${"ab".repeat(32)}`;
const COMMON = {
	nonce: "0x1",
	gas: "0x5208",
	to: ADDRESS,
	value: "0x0",
	input: "0x",
	r: `0x${"11".repeat(32)}`,
	s: `0x${"22".repeat(32)}`,
};
const FEES = {
	chainId: "0x1",
	maxPriorityFeePerGas: "0x1",
	maxFeePerGas: "0x2",
	yParity: "0x1",
};
const AUTH = {
	chainId: "0x1",
	address: ADDRESS,
	nonce: "0x0",
	yParity: "0x0",
	r: "0x1",
	s: "0x2",
};

const VALID: Record<string, Record<string, unknown>> = {
	legacy: { ...COMMON, type: "0x0", gasPrice: "0x1", v: "0x1b" },
	eip2930: {
		...COMMON,
		type: "0x1",
		chainId: "0x1",
		gasPrice: "0x1",
		yParity: "0x0",
	},
	eip1559: { ...COMMON, ...FEES, type: "0x2" },
	eip4844: {
		...COMMON,
		...FEES,
		type: "0x3",
		maxFeePerBlobGas: "0x3",
		blobVersionedHashes: [HASH],
	},
	eip7702: { ...COMMON, ...FEES, type: "0x4", authorizationList: [AUTH] },
};

const REQUIRED: Record<string, string[]> = {
	legacy: ["nonce", "gas", "value", "input", "r", "s", "gasPrice", "v"],
	eip2930: [
		"nonce",
		"gas",
		"value",
		"input",
		"r",
		"s",
		"chainId",
		"gasPrice",
		"yParity",
	],
	eip1559: [
		"nonce",
		"gas",
		"value",
		"input",
		"r",
		"s",
		"chainId",
		"maxPriorityFeePerGas",
		"maxFeePerGas",
		"yParity",
	],
	eip4844: [
		"nonce",
		"to",
		"chainId",
		"maxFeePerGas",
		"maxFeePerBlobGas",
		"blobVersionedHashes",
		"yParity",
	],
	eip7702: ["nonce", "chainId", "maxFeePerGas", "authorizationList", "yParity"],
};

const without = (rpc: Record<string, unknown>, field: string) => {
	const copy = { ...rpc };
	delete copy[field];
	return copy as Rpc;
};

describe("Transaction.fromRpc input validation", () => {
	it.each([
		["a transaction hash string", HASH],
		["null", null],
		["undefined", undefined],
		["a number", 1],
		["an array", [HASH]],
	])(
		"rejects %s instead of returning a zeroed legacy transaction",
		(_n, input) => {
			expect(() => fromRpc(input as unknown as Rpc)).toThrow(
				InvalidFormatError,
			);
			expect(() => fromRpc(input as unknown as Rpc)).toThrow(
				/Expected a transaction object/,
			);
		},
	);

	it("rejects an empty object", () => {
		expect(() => fromRpc({})).toThrow(
			/Missing required transaction field: nonce/,
		);
	});

	for (const [name, rpc] of Object.entries(VALID)) {
		describe(name, () => {
			it("decodes when every required field is present", () => {
				const tx = fromRpc(rpc as Rpc);
				expect(tx.nonce).toBe(1n);
				expect(tx.gasLimit).toBe(21000n);
			});

			it.each(REQUIRED[name] ?? [])("requires %s", (field) => {
				expect(() => fromRpc(without(rpc, field))).toThrow(InvalidFormatError);
				expect(() => fromRpc(without(rpc, field))).toThrow(
					new RegExp(
						`Missing required transaction field: .*${field === "input" ? "input" : field}`,
					),
				);
			});
		});
	}

	it("keeps the documented defaults: missing type is legacy, missing to is creation, missing accessList is empty", () => {
		const legacy = fromRpc(
			without(without(VALID.legacy ?? {}, "type") as never, "to"),
		);
		expect(legacy.type).toBe(Type.Legacy);
		expect(legacy.to).toBeNull();
		const eip1559 = fromRpc(VALID.eip1559 as Rpc);
		expect("accessList" in eip1559 && eip1559.accessList).toEqual([]);
	});

	it("accepts gasLimit and data as aliases of gas and input", () => {
		const rpc = {
			...without(without(VALID.legacy ?? {}, "gas") as never, "input"),
			gasLimit: "0x5208",
			data: "0xabcd",
		};
		const tx = fromRpc(rpc as Rpc);
		expect(tx.gasLimit).toBe(21000n);
		expect(tx.data).toEqual(new Uint8Array([0xab, 0xcd]));
	});

	it.each([
		["nonce", "1"],
		["nonce", "0x"],
		["nonce", "0xzz"],
		["nonce", 1],
		["value", "ten"],
		["input", "0xzz"],
		["r", "0x"],
		["type", "legacy"],
	])("rejects malformed %s = %j", (field, value) => {
		expect(() =>
			fromRpc({ ...VALID.legacy, [field]: value } as unknown as Rpc),
		).toThrow(InvalidFormatError);
	});

	it("rejects a signature scalar over 32 bytes", () => {
		expect(() =>
			fromRpc({ ...VALID.legacy, r: `0x${"11".repeat(33)}` } as Rpc),
		).toThrow(InvalidLengthError);
	});

	it("pads short signature scalars to 32 bytes", () => {
		const tx = fromRpc({ ...VALID.legacy, r: "0x1" } as Rpc);
		expect(tx.r.length).toBe(32);
		expect(tx.r[31]).toBe(1);
	});

	it("requires every authorization field (EIP-7702)", () => {
		for (const field of Object.keys(AUTH)) {
			const auth = { ...AUTH } as Record<string, unknown>;
			delete auth[field];
			expect(
				() => fromRpc({ ...VALID.eip7702, authorizationList: [auth] } as Rpc),
				field,
			).toThrow(InvalidFormatError);
		}
	});
});
