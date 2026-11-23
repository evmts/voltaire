import { describe, expect, it } from "vitest";
import { DecodingError } from "../errors/index.js";
import { encode } from "../Rlp/encode.js";
import type { BrandedRlp } from "../Rlp/RlpType.js";
import { deserialize } from "./deserialize.js";
import { deserializeUnsigned } from "./deserializeUnsigned.js";
import { deserialize as deserialize1559 } from "./EIP1559/deserialize.js";
import { deserialize as deserialize2930 } from "./EIP2930/deserialize.js";
import { deserialize as deserialize4844 } from "./EIP4844/deserialize.js";
import { deserialize as deserialize7702 } from "./EIP7702/deserialize.js";
import { deserialize as deserializeLegacy } from "./Legacy/deserialize.js";
import {
	decodeAuthorizationList,
	decodeBigint,
	decodeBytesField,
	decodeListField,
	decodeSignatureScalar,
	decodeUint,
	decodeYParity,
} from "./utils.js";

type Field = Uint8Array | Field[];

const b = (...bytes: number[]) => new Uint8Array(bytes);
const EMPTY = b();
const ADDRESS = new Uint8Array(20).fill(0x42);
const SCALAR = new Uint8Array(32).fill(0x11);
const BLOB_HASH = new Uint8Array(32).fill(0xab);
BLOB_HASH[0] = 0x01;
const KEY = new Uint8Array(32).fill(0x07);

const bytesField = (value: Uint8Array): BrandedRlp => ({
	type: "bytes",
	value,
});
const listField = (value: BrandedRlp[]): BrandedRlp => ({
	type: "list",
	value,
});

const AUTH: Field[] = [b(1), ADDRESS, b(7), b(1), SCALAR, SCALAR];
const ACCESS_LIST: Field[] = [[ADDRESS, [KEY]]];

/** Canonical signed field lists, by wire position. */
const LEGACY: Field[] = [
	b(1),
	b(2),
	b(0x52, 0x08),
	ADDRESS,
	b(3),
	b(0xaa),
	b(37),
	SCALAR,
	SCALAR,
];
const EIP2930: Field[] = [
	b(1),
	b(1),
	b(2),
	b(0x52, 0x08),
	ADDRESS,
	b(3),
	b(0xaa),
	ACCESS_LIST,
	b(1),
	SCALAR,
	SCALAR,
];
const EIP1559: Field[] = [
	b(1),
	b(1),
	b(2),
	b(3),
	b(0x52, 0x08),
	ADDRESS,
	b(3),
	b(0xaa),
	ACCESS_LIST,
	b(1),
	SCALAR,
	SCALAR,
];
const EIP4844: Field[] = [
	b(1),
	b(1),
	b(2),
	b(3),
	b(0x52, 0x08),
	ADDRESS,
	b(3),
	b(0xaa),
	ACCESS_LIST,
	b(4),
	[BLOB_HASH],
	b(1),
	SCALAR,
	SCALAR,
];
const EIP7702: Field[] = [
	b(1),
	b(1),
	b(2),
	b(3),
	b(0x52, 0x08),
	ADDRESS,
	b(3),
	b(0xaa),
	ACCESS_LIST,
	[AUTH],
	b(1),
	SCALAR,
	SCALAR,
];

const wire = (type: number | null, fields: Field[]) => {
	const rlp = encode(fields);
	if (type === null) return rlp;
	const out = new Uint8Array(1 + rlp.length);
	out[0] = type;
	out.set(rlp, 1);
	return out;
};

const withField = (fields: Field[], index: number, value: Field) =>
	fields.map((field, i) => (i === index ? value : field));

type Layout = {
	name: string;
	type: number | null;
	fields: Field[];
	decode: (data: Uint8Array) => unknown;
	/** Index of each kind of field. */
	uints: number[];
	uint64s: number[];
	to: number;
	data: number;
	accessList?: number;
	yParity?: number;
	r: number;
	s: number;
};

const LAYOUTS: Layout[] = [
	{
		name: "Legacy",
		type: null,
		fields: LEGACY,
		decode: deserializeLegacy,
		uints: [0, 1, 2, 4, 6],
		uint64s: [0, 2],
		to: 3,
		data: 5,
		r: 7,
		s: 8,
	},
	{
		name: "EIP-2930",
		type: 1,
		fields: EIP2930,
		decode: deserialize2930,
		uints: [0, 1, 2, 3, 5],
		uint64s: [1, 3],
		to: 4,
		data: 6,
		accessList: 7,
		yParity: 8,
		r: 9,
		s: 10,
	},
	{
		name: "EIP-1559",
		type: 2,
		fields: EIP1559,
		decode: deserialize1559,
		uints: [0, 1, 2, 3, 4, 6],
		uint64s: [1, 4],
		to: 5,
		data: 7,
		accessList: 8,
		yParity: 9,
		r: 10,
		s: 11,
	},
	{
		name: "EIP-4844",
		type: 3,
		fields: EIP4844,
		decode: deserialize4844,
		uints: [0, 1, 2, 3, 4, 6, 9],
		uint64s: [1, 4],
		to: 5,
		data: 7,
		accessList: 8,
		yParity: 11,
		r: 12,
		s: 13,
	},
	{
		name: "EIP-7702",
		type: 4,
		fields: EIP7702,
		decode: deserialize7702,
		uints: [0, 1, 2, 3, 4, 6],
		uint64s: [1, 4],
		to: 5,
		data: 7,
		accessList: 8,
		yParity: 10,
		r: 11,
		s: 12,
	},
];

describe("strict RLP field decoders", () => {
	describe("decodeYParity", () => {
		it("accepts only the empty string (0) and 0x01 (1)", () => {
			expect(decodeYParity(bytesField(EMPTY))).toBe(0);
			expect(decodeYParity(bytesField(b(1)))).toBe(1);
		});

		it.each([
			["0x00 (non-minimal zero)", bytesField(b(0))],
			["0x02", bytesField(b(2))],
			["0x1b (legacy v)", bytesField(b(27))],
			["0x01ff (multi-byte)", bytesField(b(1, 0xff))],
			["0x0001 (padded one)", bytesField(b(0, 1))],
			["a list", listField([])],
			["a list holding 0x01", listField([bytesField(b(1))])],
			["a missing field", undefined],
		])("rejects %s", (_name, field) => {
			expect(() => decodeYParity(field)).toThrow(DecodingError);
		});
	});

	describe("decodeUint", () => {
		it("decodes canonical integers up to maxBytes", () => {
			expect(decodeUint(bytesField(EMPTY), 8)).toBe(0n);
			expect(decodeUint(bytesField(b(1)), 8)).toBe(1n);
			expect(decodeUint(bytesField(b(1, 0)), 8)).toBe(256n);
			expect(decodeUint(bytesField(new Uint8Array(8).fill(0xff)), 8)).toBe(
				2n ** 64n - 1n,
			);
			expect(decodeUint(bytesField(new Uint8Array(32).fill(0xff)), 32)).toBe(
				2n ** 256n - 1n,
			);
		});

		it("rejects leading zero bytes", () => {
			expect(() => decodeUint(bytesField(b(0)), 8)).toThrow("leading zero");
			expect(() => decodeUint(bytesField(b(0, 1)), 8)).toThrow("leading zero");
		});

		it("rejects values longer than maxBytes", () => {
			expect(() =>
				decodeUint(bytesField(new Uint8Array(9).fill(1)), 8),
			).toThrow("9 bytes exceeds 8");
			expect(() =>
				decodeUint(bytesField(new Uint8Array(33).fill(1)), 32, "chainId"),
			).toThrow("Invalid chainId: 33 bytes exceeds 32");
		});

		it("rejects lists and missing fields", () => {
			expect(() => decodeUint(listField([]), 8)).toThrow(DecodingError);
			expect(() => decodeUint(undefined, 8)).toThrow(DecodingError);
		});
	});

	it("decodeBigint rejects leading zero bytes", () => {
		expect(decodeBigint(EMPTY)).toBe(0n);
		expect(decodeBigint(b(0x12, 0x34))).toBe(0x1234n);
		expect(() => decodeBigint(b(0))).toThrow(DecodingError);
		expect(() => decodeBigint(b(0, 0x12))).toThrow("leading zero");
	});

	it("decodeSignatureScalar rejects leading zeros and more than 32 bytes", () => {
		expect(decodeSignatureScalar(b(5))).toEqual(
			Uint8Array.from({ length: 32 }, (_, i) => (i === 31 ? 5 : 0)),
		);
		expect(decodeSignatureScalar(SCALAR)).toEqual(SCALAR);
		expect(() => decodeSignatureScalar(b(0, 5))).toThrow(DecodingError);
		const padded32 = new Uint8Array(32).fill(1);
		padded32[0] = 0;
		expect(() => decodeSignatureScalar(padded32)).toThrow("leading zero");
		expect(() => decodeSignatureScalar(new Uint8Array(33).fill(1))).toThrow(
			"Invalid signature scalar length",
		);
	});

	it("decodeBytesField and decodeListField check the RLP type", () => {
		expect(decodeBytesField(bytesField(b(1)), "x")).toEqual(b(1));
		expect(decodeListField(listField([]), "x")).toEqual([]);
		expect(() => decodeBytesField(listField([]), "data")).toThrow(
			"Invalid data: expected RLP byte string",
		);
		expect(() => decodeListField(bytesField(EMPTY), "accessList")).toThrow(
			"Invalid accessList: expected RLP list",
		);
		expect(() => decodeBytesField(undefined, "x")).toThrow(DecodingError);
		expect(() => decodeListField(undefined, "x")).toThrow(DecodingError);
	});
});

describe("decodeAuthorizationList", () => {
	const tuple = (fields: Uint8Array[]) => listField(fields.map(bytesField));
	const valid = [b(1), ADDRESS, b(7), b(1), SCALAR, SCALAR];
	const decodeOne = (fields: Uint8Array[]) =>
		decodeAuthorizationList(listField([tuple(fields)]));
	const replace = (index: number, value: Uint8Array) =>
		valid.map((field, i) => (i === index ? value : field));

	it("decodes a canonical tuple", () => {
		expect(decodeOne(valid)).toEqual([
			{
				chainId: 1n,
				address: ADDRESS,
				nonce: 7n,
				yParity: 1,
				r: SCALAR,
				s: SCALAR,
			},
		]);
		expect(decodeOne(replace(3, EMPTY))[0]?.yParity).toBe(0);
		expect(decodeOne(replace(0, EMPTY))[0]?.chainId).toBe(0n);
		expect(
			decodeOne(replace(0, new Uint8Array(32).fill(0xff)))[0]?.chainId,
		).toBe(2n ** 256n - 1n);
		expect(decodeOne(replace(2, new Uint8Array(8).fill(0xff)))[0]?.nonce).toBe(
			2n ** 64n - 1n,
		);
		expect(decodeAuthorizationList(listField([]))).toEqual([]);
	});

	it("accepts any canonical uint8 yParity (EIP-7702 skips, not rejects, bad parity)", () => {
		for (const value of [2, 27, 28, 0x7f, 0x80, 0xff]) {
			expect(decodeOne(replace(3, b(value)))[0]?.yParity).toBe(value);
		}
	});

	it("requires the list itself to be an RLP list", () => {
		expect(() => decodeAuthorizationList(bytesField(EMPTY))).toThrow(
			"Invalid authorization list",
		);
		expect(() => decodeAuthorizationList(undefined)).toThrow(
			"Invalid authorization list",
		);
	});

	it("requires each tuple to be a list of 6 byte strings", () => {
		expect(() =>
			decodeAuthorizationList(listField([bytesField(b(1))])),
		).toThrow("Invalid authorization item");
		expect(() => decodeOne(valid.slice(0, 5))).toThrow(
			"Invalid authorization item",
		);
		expect(() => decodeOne([...valid, EMPTY])).toThrow(
			"Invalid authorization item",
		);
		for (let i = 0; i < 6; i++) {
			const fields = valid.map(bytesField);
			fields[i] = listField([]);
			expect(() =>
				decodeAuthorizationList(listField([listField(fields)])),
			).toThrow("Invalid authorization item");
		}
	});

	it.each([
		["chainId with a leading zero", 0, b(0, 1)],
		["chainId 0x00", 0, b(0)],
		["chainId over 32 bytes", 0, new Uint8Array(33).fill(1)],
		["address of 19 bytes", 1, new Uint8Array(19).fill(1)],
		["address of 21 bytes", 1, new Uint8Array(21).fill(1)],
		["empty address", 1, EMPTY],
		["nonce with a leading zero", 2, b(0, 1)],
		["nonce over 8 bytes", 2, new Uint8Array(9).fill(1)],
		["yParity 0x00", 3, b(0)],
		["yParity over one byte (256)", 3, b(1, 0)],
		["yParity 0x01ff", 3, b(1, 0xff)],
		["r with a leading zero", 4, b(0, 1)],
		["r over 32 bytes", 4, new Uint8Array(33).fill(1)],
		["s with a leading zero", 5, b(0, 1)],
		["s over 32 bytes", 5, new Uint8Array(33).fill(1)],
	])("rejects %s", (_name, index, value) => {
		expect(() => decodeOne(replace(index, value))).toThrow();
	});
});

describe("strict typed transaction deserializers", () => {
	for (const layout of LAYOUTS) {
		describe(layout.name, () => {
			const bad = (index: number, value: Field) =>
				layout.decode(
					wire(layout.type, withField(layout.fields, index, value)),
				);

			it("accepts the canonical encoding", () => {
				const tx = layout.decode(wire(layout.type, layout.fields)) as {
					r: Uint8Array;
					s: Uint8Array;
				};
				expect(tx.r).toEqual(SCALAR);
				expect(tx.s).toEqual(SCALAR);
				// The dispatcher applies the same rules.
				expect(deserialize(wire(layout.type, layout.fields))).toEqual(tx);
			});

			it("rejects a list in every byte-string position", () => {
				for (let i = 0; i < layout.fields.length; i++) {
					if (Array.isArray(layout.fields[i])) continue;
					expect(() => bad(i, []), `field ${i}`).toThrow();
					expect(() => bad(i, [b(1)]), `field ${i}`).toThrow();
				}
			});

			it("rejects a byte string in every list position", () => {
				let lists = 0;
				for (let i = 0; i < layout.fields.length; i++) {
					if (!Array.isArray(layout.fields[i])) continue;
					lists++;
					expect(() => bad(i, EMPTY), `field ${i}`).toThrow();
					expect(() => bad(i, b(1)), `field ${i}`).toThrow();
				}
				expect(lists).toBe(
					layout.fields.filter((field) => Array.isArray(field)).length,
				);
			});

			it("rejects integers with a leading zero byte", () => {
				for (const i of layout.uints) {
					expect(() => bad(i, b(0)), `field ${i}`).toThrow("leading zero");
					expect(() => bad(i, b(0, 1)), `field ${i}`).toThrow("leading zero");
				}
			});

			it("rejects integers wider than their field", () => {
				for (const i of layout.uints) {
					const max = layout.uint64s.includes(i) ? 8 : 32;
					expect(
						() => bad(i, new Uint8Array(max).fill(0xff)),
						`field ${i}`,
					).not.toThrow();
					expect(
						() => bad(i, new Uint8Array(max + 1).fill(0xff)),
						`field ${i}`,
					).toThrow(`${max + 1} bytes exceeds ${max}`);
				}
			});

			it("rejects non-canonical r and s", () => {
				for (const i of [layout.r, layout.s]) {
					expect(() => bad(i, b(0, 1))).toThrow("leading zero");
					const padded = new Uint8Array(32).fill(1);
					padded[0] = 0;
					expect(() => bad(i, padded)).toThrow("leading zero");
					expect(() => bad(i, new Uint8Array(33).fill(1))).toThrow(
						"Invalid signature scalar length",
					);
				}
			});

			it("rejects `to` that is neither empty nor 20 bytes", () => {
				expect(() => bad(layout.to, new Uint8Array(19).fill(1))).toThrow();
				expect(() => bad(layout.to, new Uint8Array(21).fill(1))).toThrow();
			});

			if (layout.yParity !== undefined) {
				const yParity = layout.yParity;
				it("accepts yParity only as the empty string or 0x01", () => {
					expect((bad(yParity, EMPTY) as { yParity: number }).yParity).toBe(0);
					expect((bad(yParity, b(1)) as { yParity: number }).yParity).toBe(1);
					for (const value of [b(0), b(2), b(27), b(1, 0xff), b(0, 1)]) {
						expect(() => bad(yParity, value)).toThrow("Invalid yParity");
					}
				});
			}

			if (layout.accessList !== undefined) {
				const accessList = layout.accessList;
				it("validates access list structure", () => {
					expect(() => bad(accessList, [])).not.toThrow();
					expect(() => bad(accessList, [ADDRESS])).toThrow();
					expect(() => bad(accessList, [[ADDRESS]])).toThrow();
					expect(() => bad(accessList, [[ADDRESS, KEY]])).toThrow();
					expect(() => bad(accessList, [[[ADDRESS], [KEY]]])).toThrow();
					expect(() => bad(accessList, [[ADDRESS, [[KEY]]]])).toThrow();
					expect(() =>
						bad(accessList, [[new Uint8Array(19), [KEY]]]),
					).toThrow();
					expect(() =>
						bad(accessList, [[ADDRESS, [new Uint8Array(31)]]]),
					).toThrow();
				});
			}

			it("rejects a wrong field count", () => {
				expect(() =>
					layout.decode(wire(layout.type, layout.fields.slice(0, -1))),
				).toThrow(DecodingError);
				expect(() =>
					layout.decode(wire(layout.type, [...layout.fields, EMPTY])),
				).toThrow(DecodingError);
			});
		});
	}

	describe("EIP-7702 specifics", () => {
		const bad = (index: number, value: Field) =>
			deserialize7702(wire(4, withField(EIP7702, index, value)));

		it("requires a 20-byte `to` (no contract creation)", () => {
			expect(() => bad(5, EMPTY)).toThrow("cannot be null");
		});

		it("requires a non-empty authorization list", () => {
			expect(() => bad(9, [])).toThrow("non-empty authorization list");
			expect(() => bad(9, EMPTY)).toThrow("non-empty authorization list");
		});

		it("applies tuple rules to every authorization", () => {
			expect(() => bad(9, [AUTH, AUTH])).not.toThrow();
			const variants: Field[][] = [
				withField(AUTH, 0, b(0, 1)),
				withField(AUTH, 1, new Uint8Array(19)),
				withField(AUTH, 2, new Uint8Array(9).fill(1)),
				withField(AUTH, 3, b(0)),
				withField(AUTH, 3, b(1, 0)),
				withField(AUTH, 4, b(0, 1)),
				withField(AUTH, 5, new Uint8Array(33).fill(1)),
				withField(AUTH, 5, []),
				AUTH.slice(0, 5),
			];
			for (const [i, variant] of variants.entries()) {
				expect(() => bad(9, [AUTH, variant]), `variant ${i}`).toThrow();
			}
		});

		it("keeps an authorization whose yParity is a uint8 other than 0 or 1", () => {
			const tx = bad(9, [AUTH, withField(AUTH, 3, b(0xff))]) as {
				authorizationList: { yParity: number }[];
			};
			expect(tx.authorizationList[1]?.yParity).toBe(0xff);
			// The outer transaction signature stays strict.
			expect(() => bad(10, b(2))).toThrow("Invalid yParity");
		});
	});

	describe("EIP-4844 specifics", () => {
		const bad = (index: number, value: Field) =>
			deserialize4844(wire(3, withField(EIP4844, index, value)));

		it("requires a 20-byte `to`", () => {
			expect(() => bad(5, EMPTY)).toThrow("cannot be null");
		});

		it("requires a non-empty blob versioned hash list", () => {
			expect(() => bad(10, [])).toThrow("at least one blob versioned hash");
		});

		it("validates each blob versioned hash", () => {
			expect(() => bad(10, [BLOB_HASH, BLOB_HASH])).not.toThrow();
			expect(() => bad(10, [BLOB_HASH.slice(1)])).toThrow();
			expect(() => bad(10, [[BLOB_HASH]])).toThrow();
			expect(() => bad(10, [new Uint8Array(32).fill(2)])).toThrow(
				"version byte",
			);
		});
	});
});

describe("deserializeUnsigned applies the signed rules", () => {
	const unsigned = (layout: Layout) =>
		layout.type === null
			? [...layout.fields.slice(0, 6), b(1), EMPTY, EMPTY]
			: layout.fields.slice(0, -3);

	for (const layout of LAYOUTS) {
		it(`${layout.name}: accepts canonical, rejects non-canonical integers and wrong types`, () => {
			const fields = unsigned(layout);
			expect(() =>
				deserializeUnsigned(wire(layout.type, fields)),
			).not.toThrow();
			for (const i of layout.uints.filter((index) => index < fields.length)) {
				expect(
					() =>
						deserializeUnsigned(
							wire(layout.type, withField(fields, i, b(0, 1))),
						),
					`field ${i}`,
				).toThrow("leading zero");
				expect(
					() =>
						deserializeUnsigned(wire(layout.type, withField(fields, i, []))),
					`field ${i}`,
				).toThrow();
			}
			if (layout.accessList !== undefined) {
				expect(() =>
					deserializeUnsigned(
						wire(
							layout.type,
							withField(fields, layout.accessList as number, EMPTY),
						),
					),
				).toThrow();
			}
		});
	}

	it("Legacy: r and s must be empty byte strings", () => {
		const fields = unsigned(LAYOUTS[0] as Layout);
		expect(() =>
			deserializeUnsigned(wire(null, withField(fields, 7, b(1)))),
		).toThrow("r and s must be empty");
		expect(() =>
			deserializeUnsigned(wire(null, withField(fields, 8, SCALAR))),
		).toThrow("r and s must be empty");
		expect(() =>
			deserializeUnsigned(wire(null, withField(fields, 7, []))),
		).toThrow("r and s must be empty");
		const tx = deserializeUnsigned(wire(null, fields));
		expect(tx).toMatchObject({ chainId: 1n });
		expect(tx).not.toHaveProperty("r");
		expect(tx).not.toHaveProperty("s");
	});

	it("EIP-7702: empty authorization list and null `to` are rejected", () => {
		const fields = EIP7702.slice(0, -3);
		expect(() =>
			deserializeUnsigned(wire(4, withField(fields, 9, []))),
		).toThrow("non-empty authorization list");
		expect(() =>
			deserializeUnsigned(wire(4, withField(fields, 5, EMPTY))),
		).toThrow("cannot be null");
	});

	it("EIP-4844: empty blob hash list is rejected", () => {
		const fields = EIP4844.slice(0, -3);
		expect(() =>
			deserializeUnsigned(wire(3, withField(fields, 10, []))),
		).toThrow("at least one blob versioned hash");
	});
});
