import { describe, expect, it } from "vitest";
import { encode } from "../Rlp/encode.js";
import { RlpDecodingError } from "../Rlp/RlpError.js";
import { deserialize } from "./deserialize.js";
import { deserializeUnsigned } from "./deserializeUnsigned.js";

type Field = Uint8Array | Field[];

const b = (...bytes: number[]) => new Uint8Array(bytes);
const EMPTY = b();
const ADDRESS = new Uint8Array(20).fill(0x42);
const SCALAR = new Uint8Array(32).fill(0x11);
const BLOB_HASH = new Uint8Array(32).fill(0xab);
BLOB_HASH[0] = 0x01;
const KEY = new Uint8Array(32).fill(0x07);
const AUTH: Field[] = [b(1), ADDRESS, b(7), b(1), SCALAR, SCALAR];
const ACCESS_LIST: Field[] = [[ADDRESS, [KEY]]];
const FEES_1559: Field[] = [b(1), b(1), b(2), b(3), b(0x52, 0x08)];
const CALL: Field[] = [ADDRESS, b(3), b(0xaa)];
const SIGNATURE: Field[] = [b(1), SCALAR, SCALAR];

/** Canonical signed field lists. `nonce` is the wire index of the nonce. */
const LAYOUTS: {
	name: string;
	type: number | null;
	nonce: number;
	accessList?: number;
	fields: Field[];
}[] = [
	{
		name: "Legacy",
		type: null,
		nonce: 0,
		fields: [b(1), b(2), b(0x52, 0x08), ...CALL, b(37), SCALAR, SCALAR],
	},
	{
		name: "EIP2930",
		type: 1,
		nonce: 1,
		accessList: 7,
		fields: [
			b(1),
			b(1),
			b(2),
			b(0x52, 0x08),
			...CALL,
			ACCESS_LIST,
			...SIGNATURE,
		],
	},
	{
		name: "EIP1559",
		type: 2,
		nonce: 1,
		accessList: 8,
		fields: [...FEES_1559, ...CALL, ACCESS_LIST, ...SIGNATURE],
	},
	{
		name: "EIP4844",
		type: 3,
		nonce: 1,
		accessList: 8,
		fields: [
			...FEES_1559,
			...CALL,
			ACCESS_LIST,
			b(4),
			[BLOB_HASH],
			...SIGNATURE,
		],
	},
	{
		name: "EIP7702",
		type: 4,
		nonce: 1,
		accessList: 8,
		fields: [...FEES_1559, ...CALL, ACCESS_LIST, [AUTH], ...SIGNATURE],
	},
];

/** RLP list header for a payload of `length` bytes. */
function listHeader(length: number): Uint8Array {
	if (length < 56) return b(0xc0 + length);
	const size: number[] = [];
	for (let n = length; n > 0; n = Math.floor(n / 256)) size.unshift(n % 256);
	return b(0xf7 + size.length, ...size);
}

/**
 * Serialize `fields` as an RLP list, writing `raw` verbatim for the field at
 * `index`. The outer framing stays correct, so only the nested item is
 * non-canonical.
 */
function wire(
	type: number | null,
	fields: Field[],
	index = -1,
	raw: Uint8Array = EMPTY,
): Uint8Array {
	const items = fields.map((field, i) => (i === index ? raw : encode(field)));
	const payload = items.reduce((sum, item) => sum + item.length, 0);
	const header = listHeader(payload);
	const out = new Uint8Array((type === null ? 0 : 1) + header.length + payload);
	let offset = 0;
	if (type !== null) out[offset++] = type;
	out.set(header, offset);
	offset += header.length;
	for (const item of items) {
		out.set(item, offset);
		offset += item.length;
	}
	return out;
}

/** Long-form string header for a 32-byte scalar (canonical is 0xa0). */
const LONG_FORM_SCALAR = b(0xb8, 32, ...SCALAR);
/** Nonce 1 as a prefixed single byte (canonical is 0x01). */
const PREFIXED_NONCE = b(0x81, 0x01);
/** Access list holding a long-form empty list (canonical is 0xc0). */
const LONG_FORM_ACCESS_LIST = b(0xc2, 0xf8, 0x00);

describe("transaction decoding rejects nested non-canonical RLP", () => {
	for (const layout of LAYOUTS) {
		describe(layout.name, () => {
			const { type, fields, nonce } = layout;
			const s = fields.length - 1;

			it("accepts the canonical encoding (control)", () => {
				expect(wire(type, fields)).toEqual(
					type === null ? encode(fields) : b(type, ...encode(fields)),
				);
				expect(() => deserialize(wire(type, fields))).not.toThrow();
			});

			it("rejects a prefixed single-byte nonce", () => {
				const data = wire(type, fields, nonce, PREFIXED_NONCE);
				expect(() => deserialize(data)).toThrow(RlpDecodingError);
				expect(() => deserialize(data)).toThrow(/should not be prefixed/);
			});

			it("rejects a long-form signature scalar", () => {
				const data = wire(type, fields, s, LONG_FORM_SCALAR);
				expect(() => deserialize(data)).toThrow(RlpDecodingError);
				expect(() => deserialize(data)).toThrow(/short form/);
			});

			if (layout.accessList !== undefined) {
				const accessList = layout.accessList;
				it("rejects a non-canonical item inside the access list", () => {
					const data = wire(type, fields, accessList, LONG_FORM_ACCESS_LIST);
					expect(() => deserialize(data)).toThrow(RlpDecodingError);
				});
			}
		});
	}

	it("EIP7702: rejects a prefixed single byte inside an authorization tuple", () => {
		const layout = LAYOUTS[4];
		if (!layout) throw new Error("missing EIP7702 layout");
		// [[chainId = 0x8101 (non-canonical), address, nonce, yParity, r, s]]
		const tuple = [b(0x81, 0x01), ...AUTH.slice(1).map((f) => encode(f))];
		const tupleLength = tuple.reduce((sum, item) => sum + item.length, 0);
		const tupleBytes = b(
			...listHeader(tupleLength),
			...tuple.flatMap((item) => [...item]),
		);
		const raw = b(...listHeader(tupleBytes.length), ...tupleBytes);
		const data = wire(4, layout.fields, 9, raw);
		expect(() => deserialize(data)).toThrow(RlpDecodingError);
		expect(() => deserialize(data)).toThrow(/should not be prefixed/);
	});
});

describe("deserializeUnsigned rejects nested non-canonical RLP", () => {
	for (const layout of LAYOUTS) {
		const fields =
			layout.type === null
				? [...layout.fields.slice(0, 6), b(1), EMPTY, EMPTY]
				: layout.fields.slice(0, -3);

		it(`${layout.name}: canonical decodes, prefixed single-byte nonce throws`, () => {
			expect(() =>
				deserializeUnsigned(wire(layout.type, fields)),
			).not.toThrow();
			const data = wire(layout.type, fields, layout.nonce, PREFIXED_NONCE);
			expect(() => deserializeUnsigned(data)).toThrow(RlpDecodingError);
			expect(() => deserializeUnsigned(data)).toThrow(/should not be prefixed/);
		});
	}
});
