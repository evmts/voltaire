/**
 * Issue #100: Comprehensive negative-case input validation on core `from()` constructors.
 *
 * Ensures NaN, Infinity, -Infinity, non-integer floats, negative numbers for unsigned ints,
 * odd-length or non-hex strings, wrong byte lengths, and null/undefined inputs throw typed
 * Voltaire errors instead of returning invalid values or throwing raw JS TypeErrors/RangeErrors.
 */

import { describe, expect, it } from "vitest";
import { Bytes } from "../Bytes/index.js";
import {
	IntegerOverflowError,
	IntegerUnderflowError,
	InvalidFormatError,
	InvalidLengthError,
	InvalidRangeError,
} from "../errors/index.js";
import * as Hash from "../Hash/index.js";
import * as Hex from "../Hex/index.js";
import * as Int8 from "../Int8/index.js";
import * as Int16 from "../Int16/index.js";
import * as Int32 from "../Int32/index.js";
import * as Int64 from "../Int64/index.js";
import * as Int128 from "../Int128/index.js";
import * as Int256 from "../Int256/index.js";
import * as PrivateKey from "../PrivateKey/index.js";
import * as PublicKey from "../PublicKey/index.js";
import * as Signature from "../Signature/index.js";
import * as Uint256 from "../Uint/index.js";
import * as Uint8 from "../Uint8/index.js";
import * as Uint16 from "../Uint16/index.js";
import * as Uint32 from "../Uint32/index.js";
import * as Uint64 from "../Uint64/index.js";
import * as Uint128 from "../Uint128/index.js";
import * as AddressErrors from "./errors.js";
import { Address } from "./index.js";

const BAD_NULLISH = [null, undefined, {}] as unknown[];

describe("Issue #100: Address input validation", () => {
	it("rejects NaN, Infinity, -Infinity, floats, negative, and nullish in fromNumber", () => {
		for (const bad of [
			Number.NaN,
			Number.POSITIVE_INFINITY,
			Number.NEGATIVE_INFINITY,
			1.5,
			-1,
			-1n,
			...BAD_NULLISH,
		]) {
			expect(() => Address.fromNumber(bad as never)).toThrow(
				AddressErrors.InvalidValueError,
			);
		}
	});

	it("rejects nullish/wrong types in fromBytes, fromHex, fromAbiEncoded, from", () => {
		for (const bad of BAD_NULLISH) {
			expect(() => Address.from(bad as never)).toThrow(
				AddressErrors.InvalidValueError,
			);
			expect(() => Address.fromBytes(bad as never)).toThrow(
				AddressErrors.InvalidAddressLengthError,
			);
			expect(() => Address.fromHex(bad as never)).toThrow(
				AddressErrors.InvalidHexFormatError,
			);
			expect(() => Address.fromAbiEncoded(bad as never)).toThrow(
				AddressErrors.InvalidAddressLengthError,
			);
		}
		expect(() => Address.fromHex("0x123")).toThrow(
			AddressErrors.InvalidHexFormatError,
		);
		expect(() => Address.fromHex(`0x${"g".repeat(40)}`)).toThrow(
			AddressErrors.InvalidHexStringError,
		);
		expect(() => Address.fromBytes(new Uint8Array(19))).toThrow(
			AddressErrors.InvalidAddressLengthError,
		);
	});
});

describe("Issue #100: Hex & Bytes & Hash input validation", () => {
	it("Hex.from rejects invalid strings, non-hex chars, and nullish", () => {
		for (const bad of ["", "1234", "0xzz", "0x12g4", ...BAD_NULLISH, 123]) {
			expect(() => Hex.from(bad as never)).toThrow(InvalidFormatError);
		}
		for (const bad of BAD_NULLISH) {
			expect(() => Hex.fromBytes(bad as never)).toThrow(InvalidFormatError);
			expect(() => Hex.fromBigInt(bad as never)).toThrow(InvalidFormatError);
		}
		expect(() => Hex.fromBigInt(-1n)).toThrow(InvalidRangeError);
		expect(() => Hex.fromBigInt(1n, -1)).toThrow(InvalidRangeError);
		expect(() => Hex.fromBigInt(1n, Number.NaN)).toThrow(InvalidRangeError);
		expect(() => Hex.fromNumber(Number.NaN)).toThrow(InvalidRangeError);
		expect(() => Hex.fromNumber(Number.POSITIVE_INFINITY)).toThrow(
			InvalidRangeError,
		);
		expect(() => Hex.fromNumber(Number.NEGATIVE_INFINITY)).toThrow(
			InvalidRangeError,
		);
		expect(() => Hex.fromNumber(1.5)).toThrow(InvalidRangeError);
		expect(() => Hex.fromNumber(1, -1)).toThrow(InvalidRangeError);
	});

	it("Bytes.from* rejects bad hex, odd lengths, negative, floats, and nullish", () => {
		for (const bad of ["1234", "0x123", "0x1g", ...BAD_NULLISH]) {
			expect(() => Bytes.fromHex(bad as never)).toThrow(InvalidFormatError);
		}
		for (const bad of BAD_NULLISH) {
			expect(() => Bytes.from(bad as never)).toThrow();
			expect(() => Bytes.fromBigInt(bad as never)).toThrow(InvalidFormatError);
		}
		expect(() => Bytes.fromBigInt(-1n)).toThrow(InvalidRangeError);
		expect(() => Bytes.fromBigInt(1n, -1)).toThrow(InvalidFormatError);
		expect(() => Bytes.fromNumber(Number.NaN)).toThrow(InvalidRangeError);
		expect(() => Bytes.fromNumber(1.5)).toThrow(InvalidRangeError);
		expect(() => Bytes.fromNumber(-1)).toThrow(InvalidRangeError);
		expect(() => Bytes.fromNumber(1, -1)).toThrow(InvalidRangeError);
	});

	it("Hash.from* rejects wrong lengths, non-hex chars, and nullish", () => {
		for (const bad of BAD_NULLISH) {
			expect(() => Hash.from(bad as never)).toThrow(InvalidFormatError);
			expect(() => Hash.fromBytes(bad as never)).toThrow(InvalidFormatError);
			expect(() => Hash.fromHex(bad as never)).toThrow(InvalidFormatError);
		}
		expect(() => Hash.fromHex("0x1234")).toThrow(InvalidLengthError);
		expect(() => Hash.fromHex(`0x${"g".repeat(64)}`)).toThrow(
			InvalidFormatError,
		);
		expect(() => Hash.fromBytes(new Uint8Array(31))).toThrow(
			InvalidLengthError,
		);
	});
});

describe("Issue #100: Uint* input validation", () => {
	const uints = [
		{ name: "Uint8", api: Uint8, fromBigInt: Uint8.fromBigint, max: 255n },
		{ name: "Uint16", api: Uint16, fromBigInt: Uint16.fromBigint, max: 65535n },
		{
			name: "Uint32",
			api: Uint32,
			fromBigInt: Uint32.fromBigInt,
			max: 0xffffffffn,
		},
		{
			name: "Uint64",
			api: Uint64,
			fromBigInt: Uint64.fromBigInt,
			max: (1n << 64n) - 1n,
		},
		{
			name: "Uint128",
			api: Uint128,
			fromBigInt: Uint128.fromBigInt,
			max: (1n << 128n) - 1n,
		},
		{
			name: "Uint256",
			api: Uint256,
			fromBigInt: Uint256.fromBigInt,
			max: (1n << 256n) - 1n,
		},
	];

	describe.each(uints)("$name", ({ api, fromBigInt, max }) => {
		it("rejects NaN, Infinity, -Infinity, floats, negative, overflow, and nullish in from()", () => {
			expect(() => api.from(Number.NaN)).toThrow(InvalidFormatError);
			expect(() => api.from(Number.POSITIVE_INFINITY)).toThrow(
				InvalidFormatError,
			);
			expect(() => api.from(Number.NEGATIVE_INFINITY)).toThrow(
				InvalidFormatError,
			);
			expect(() => api.from(1.5)).toThrow(InvalidFormatError);
			expect(() => api.from(-1)).toThrow(IntegerUnderflowError);
			expect(() => api.from(-1n)).toThrow(IntegerUnderflowError);
			expect(() => api.from(max + 1n)).toThrow(IntegerOverflowError);
			for (const bad of BAD_NULLISH) {
				expect(() => api.from(bad as never)).toThrow(InvalidFormatError);
				expect(() => fromBigInt(bad as never)).toThrow(InvalidFormatError);
				expect(() => api.fromBytes(bad as never)).toThrow(InvalidLengthError);
			}
		});

		it("rejects invalid hex strings and partial hex in fromHex()", () => {
			for (const bad of ["", "0x", "0x1g", "0xzz", " 0x1 ", ...BAD_NULLISH]) {
				expect(() => api.fromHex(bad as never)).toThrow(InvalidFormatError);
			}
		});
	});
});

describe("Issue #100: Int* input validation", () => {
	const ints = [
		{ name: "Int8", api: Int8, fromBigInt: Int8.fromBigint },
		{ name: "Int16", api: Int16, fromBigInt: Int16.fromBigint },
		{ name: "Int32", api: Int32, fromBigInt: Int32.fromBigInt },
		{ name: "Int64", api: Int64, fromBigInt: Int64.fromBigInt },
		{ name: "Int128", api: Int128, fromBigInt: Int128.fromBigInt },
		{ name: "Int256", api: Int256, fromBigInt: Int256.fromBigInt },
	];

	describe.each(ints)("$name", ({ api, fromBigInt }) => {
		it("rejects NaN, empty strings, and nullish inputs", () => {
			expect(() => api.from(Number.NaN)).toThrow(InvalidFormatError);
			expect(() => api.from("")).toThrow(InvalidFormatError);
			expect(() => api.from("   ")).toThrow(InvalidFormatError);
			for (const bad of BAD_NULLISH) {
				expect(() => api.from(bad as never)).toThrow(InvalidFormatError);
				expect(() => fromBigInt(bad as never)).toThrow(InvalidFormatError);
				expect(() => api.fromHex(bad as never)).toThrow(InvalidFormatError);
				expect(() => api.fromBytes(bad as never)).toThrow(InvalidLengthError);
			}
		});
	});

	it("rejects Infinity/-Infinity and floats on strict Int8/Int16/Int128/Int256", () => {
		for (const api of [Int8, Int16, Int128, Int256]) {
			expect(() => api.from(Number.POSITIVE_INFINITY)).toThrow(
				InvalidFormatError,
			);
			expect(() => api.from(Number.NEGATIVE_INFINITY)).toThrow(
				InvalidFormatError,
			);
			expect(() => api.from(1.5)).toThrow(InvalidFormatError);
		}
		expect(() => Int64.from(Number.POSITIVE_INFINITY)).toThrow(
			InvalidFormatError,
		);
		expect(() => Int64.from(Number.NEGATIVE_INFINITY)).toThrow(
			InvalidFormatError,
		);
		expect(() => Int32.from(Number.POSITIVE_INFINITY)).toThrow(
			IntegerOverflowError,
		);
		expect(() => Int32.from(Number.NEGATIVE_INFINITY)).toThrow(
			IntegerUnderflowError,
		);
	});
});

describe("Issue #100: PrivateKey, PublicKey & Signature input validation", () => {
	it("PrivateKey rejects non-strings, wrong lengths, zero key, and nullish", () => {
		for (const bad of BAD_NULLISH) {
			expect(() => PrivateKey.from(bad as never)).toThrow(InvalidFormatError);
			expect(() => PrivateKey.fromBytes(bad as never)).toThrow(
				InvalidLengthError,
			);
		}
		expect(() => PrivateKey.from("0x1234")).toThrow(InvalidLengthError);
		expect(() => PrivateKey.from(`0x${"0".repeat(64)}`)).toThrow(
			InvalidRangeError,
		);
		expect(() => PrivateKey.from(`0x${"g".repeat(64)}`)).toThrow(
			InvalidFormatError,
		);
	});

	it("PublicKey rejects non-strings, wrong lengths, non-hex, and nullish", () => {
		for (const bad of BAD_NULLISH) {
			expect(() => PublicKey.from(bad as never)).toThrow(InvalidFormatError);
		}
		expect(() => PublicKey.from("0x1234")).toThrow(InvalidLengthError);
		expect(() => PublicKey.from(`0x${"g".repeat(128)}`)).toThrow(
			InvalidFormatError,
		);
	});

	it("Signature constructors reject nullish, malformed DER/RPC/tuple, and bad lengths", () => {
		for (const bad of BAD_NULLISH) {
			expect(() => Signature.from(bad as never)).toThrow();
			expect(() => Signature.fromCompact(bad as never, "secp256k1")).toThrow();
			expect(() => Signature.fromDER(bad as never, "secp256k1")).toThrow();
			expect(() => Signature.fromEd25519(bad as never)).toThrow();
			expect(() =>
				Signature.fromP256(bad as never, new Uint8Array(32)),
			).toThrow();
			expect(() =>
				Signature.fromSecp256k1(bad as never, new Uint8Array(32)),
			).toThrow();
			expect(() => Signature.fromRpc(bad as never)).toThrow();
			expect(() => Signature.fromTuple(bad as never)).toThrow();
		}
		expect(() => Signature.fromRpc({ r: "0xzz", s: "0x01", v: 27 })).toThrow();
		expect(() =>
			Signature.fromRpc({
				r: `0x${"1".repeat(65)}`,
				s: "0x01",
				v: 27,
			}),
		).toThrow();
		expect(() =>
			Signature.fromTuple([Number.NaN, new Uint8Array(32), new Uint8Array(32)]),
		).toThrow();
	});
});
