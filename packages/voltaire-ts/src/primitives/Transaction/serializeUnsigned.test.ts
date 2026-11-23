import { bytesToHex, hexToBytes, serializeTransaction } from "viem";
import { describe, expect, it } from "vitest";
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { Address } from "../Address/index.js";
import { DecodingError } from "../errors/index.js";
import { Hash } from "../Hash/index.js";
import { deserialize } from "./deserialize.js";
import { deserializeUnsigned } from "./deserializeUnsigned.js";
import { getSigningHash } from "./getSigningHash.js";
import { serialize } from "./serialize.js";
import { serializeUnsigned } from "./serializeUnsigned.js";
import { type Any, Type } from "./types.js";
import type {
	UnsignedEIP1559,
	UnsignedEIP2930,
	UnsignedEIP4844,
	UnsignedEIP7702,
	UnsignedLegacy,
} from "./UnsignedType.js";

const TO = "0x742d35cc6634c0532925a3b844bc9e7595f0beb0";
const KEY =
	"0x0000000000000000000000000000000000000000000000000000000000000abc";
const BLOB_HASH =
	"0x01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const SIG = { r: new Uint8Array(32).fill(1), s: new Uint8Array(32).fill(2) };
const data = hexToBytes("0xa9059cbb");
const accessList = [{ address: Address(TO), storageKeys: [Hash(KEY)] }];
const viemAccessList = [{ address: TO, storageKeys: [KEY] }] as const;

const legacy155: UnsignedLegacy = {
	type: Type.Legacy,
	nonce: 7n,
	gasPrice: 20_000_000_000n,
	gasLimit: 21_000n,
	to: Address(TO),
	value: 10n ** 18n,
	data,
	chainId: 1n,
};
const legacyPre155: UnsignedLegacy = {
	type: Type.Legacy,
	nonce: 0n,
	gasPrice: 1n,
	gasLimit: 53_000n,
	to: null,
	value: 0n,
	data: hexToBytes("0x6000"),
};
const eip2930: UnsignedEIP2930 = {
	type: Type.EIP2930,
	chainId: 1n,
	nonce: 1n,
	gasPrice: 30_000_000_000n,
	gasLimit: 50_000n,
	to: Address(TO),
	value: 0n,
	data,
	accessList,
};
const eip1559: UnsignedEIP1559 = {
	type: Type.EIP1559,
	chainId: 10n,
	nonce: 2n,
	maxPriorityFeePerGas: 1_000_000_000n,
	maxFeePerGas: 30_000_000_000n,
	gasLimit: 60_000n,
	to: null,
	value: 5n,
	data,
	accessList,
};
const eip4844: UnsignedEIP4844 = {
	type: Type.EIP4844,
	chainId: 1n,
	nonce: 3n,
	maxPriorityFeePerGas: 1_000_000_000n,
	maxFeePerGas: 30_000_000_000n,
	gasLimit: 100_000n,
	to: Address(TO),
	value: 0n,
	data,
	accessList: [],
	maxFeePerBlobGas: 2_000_000_000n,
	blobVersionedHashes: [Hash(BLOB_HASH)],
};
const eip7702: UnsignedEIP7702 = {
	type: Type.EIP7702,
	chainId: 1n,
	nonce: 4n,
	maxPriorityFeePerGas: 1_000_000_000n,
	maxFeePerGas: 30_000_000_000n,
	gasLimit: 100_000n,
	to: Address(TO),
	value: 0n,
	data,
	accessList: [],
	authorizationList: [
		{
			chainId: 1n,
			address: Address(TO),
			nonce: 9n,
			yParity: 1,
			r: SIG.r,
			s: SIG.s,
		},
	],
};

/** viem's unsigned serialization: an independent oracle. */
const viemUnsigned = {
	legacy155: serializeTransaction({
		type: "legacy",
		nonce: 7,
		gasPrice: 20_000_000_000n,
		gas: 21_000n,
		to: TO,
		value: 10n ** 18n,
		data: "0xa9059cbb",
		chainId: 1,
	}),
	legacyPre155: serializeTransaction({
		type: "legacy",
		nonce: 0,
		gasPrice: 1n,
		gas: 53_000n,
		value: 0n,
		data: "0x6000",
	}),
	eip2930: serializeTransaction({
		type: "eip2930",
		chainId: 1,
		nonce: 1,
		gasPrice: 30_000_000_000n,
		gas: 50_000n,
		to: TO,
		value: 0n,
		data: "0xa9059cbb",
		accessList: viemAccessList,
	}),
	eip1559: serializeTransaction({
		type: "eip1559",
		chainId: 10,
		nonce: 2,
		maxPriorityFeePerGas: 1_000_000_000n,
		maxFeePerGas: 30_000_000_000n,
		gas: 60_000n,
		value: 5n,
		data: "0xa9059cbb",
		accessList: viemAccessList,
	}),
	eip4844: serializeTransaction({
		type: "eip4844",
		chainId: 1,
		nonce: 3,
		maxPriorityFeePerGas: 1_000_000_000n,
		maxFeePerGas: 30_000_000_000n,
		gas: 100_000n,
		to: TO,
		value: 0n,
		data: "0xa9059cbb",
		maxFeePerBlobGas: 2_000_000_000n,
		blobVersionedHashes: [BLOB_HASH],
	}),
	eip7702: serializeTransaction({
		type: "eip7702",
		chainId: 1,
		nonce: 4,
		maxPriorityFeePerGas: 1_000_000_000n,
		maxFeePerGas: 30_000_000_000n,
		gas: 100_000n,
		to: TO,
		value: 0n,
		data: "0xa9059cbb",
		authorizationList: [
			{
				chainId: 1,
				address: TO,
				nonce: 9,
				yParity: 1,
				r: bytesToHex(SIG.r),
				s: bytesToHex(SIG.s),
			},
		],
	}),
};

const cases = [
	["legacy EIP-155", legacy155, viemUnsigned.legacy155],
	["legacy pre-EIP-155", legacyPre155, viemUnsigned.legacyPre155],
	["EIP-2930", eip2930, viemUnsigned.eip2930],
	["EIP-1559", eip1559, viemUnsigned.eip1559],
	["EIP-4844", eip4844, viemUnsigned.eip4844],
	["EIP-7702", eip7702, viemUnsigned.eip7702],
] as const;

/** Strip Uint8Array subclasses (Address, Hash) so decoded plain bytes compare equal. */
function plain(value: unknown): unknown {
	if (value instanceof Uint8Array) return new Uint8Array(value);
	if (Array.isArray(value)) return value.map(plain);
	if (value !== null && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value).map(([k, v]) => [k, plain(v)]),
		);
	}
	return value;
}

/** Attach a signature so the signed APIs accept the transaction. */
function sign(tx: (typeof cases)[number][1]): Any {
	if (tx.type === Type.Legacy) {
		const { chainId, ...rest } = tx;
		const v =
			chainId === undefined || chainId === null ? 27n : chainId * 2n + 35n;
		return { ...rest, v, ...SIG } as Any;
	}
	return { ...tx, yParity: 0, ...SIG } as Any;
}

describe("serializeUnsigned / deserializeUnsigned", () => {
	it.each(cases)("%s matches viem's unsigned serialization", (_, tx, hex) => {
		expect(bytesToHex(serializeUnsigned(tx))).toBe(hex);
	});

	it.each(cases)("%s round-trips", (_, tx) => {
		expect(plain(deserializeUnsigned(serializeUnsigned(tx)))).toEqual(
			plain(tx),
		);
	});

	it.each(cases)("%s decodes viem's unsigned bytes", (_, tx, hex) => {
		expect(plain(deserializeUnsigned(hexToBytes(hex)))).toEqual(plain(tx));
	});

	it.each(cases)("%s keccak256 equals getSigningHash", (_, tx) => {
		const signed = sign(tx);
		expect(keccak256(serializeUnsigned(tx))).toEqual(
			getSigningHash.call(signed),
		);
	});

	it.each(cases)(
		"%s ignores the signature on a signed transaction",
		(_, tx) => {
			expect(serializeUnsigned(sign(tx))).toEqual(serializeUnsigned(tx));
		},
	);

	it("derives the legacy chain ID from an EIP-155 v", () => {
		const { chainId: _, ...rest } = legacy155;
		const signed = { ...rest, v: 38n, ...SIG } as Any; // chainId 1, parity 1
		expect(serializeUnsigned(signed)).toEqual(serializeUnsigned(legacy155));
	});

	it("keeps legacy chainId 0 in the EIP-155 form", () => {
		const tx = { ...legacy155, chainId: 0n };
		expect(plain(deserializeUnsigned(serializeUnsigned(tx)))).toEqual(
			plain(tx),
		);
	});

	it.each(cases)("deserialize rejects the unsigned %s envelope", (_, tx) => {
		if (tx.type === Type.Legacy && tx.chainId) {
			// EIP-155 unsigned legacy has 9 fields, so it decodes as v=chainId, r=s=0.
			expect(deserialize(serializeUnsigned(tx))).toMatchObject({
				v: tx.chainId,
			});
			return;
		}
		expect(() => deserialize(serializeUnsigned(tx))).toThrow();
	});

	it.each(cases)(
		"deserializeUnsigned rejects the signed %s envelope",
		(_, tx) => {
			expect(() => deserializeUnsigned(serialize.call(sign(tx)))).toThrow(
				DecodingError,
			);
		},
	);

	it("rejects wrong field counts", () => {
		const bytes = serializeUnsigned(eip1559);
		const truncated = new Uint8Array([Type.EIP1559, 0xc1, 0x80]);
		expect(() => deserializeUnsigned(truncated)).toThrow(
			/expected 9 fields, got 1/,
		);
		expect(() =>
			deserializeUnsigned(bytes.slice(0, bytes.length - 1)),
		).toThrow();
		expect(() => deserializeUnsigned(new Uint8Array([0xc1, 0x80]))).toThrow(
			/expected 6 or 9 fields, got 1/,
		);
	});

	it("rejects an EIP-4844 envelope with a null to", () => {
		const bytes = serializeUnsigned({ ...eip4844, to: null } as never);
		expect(() => deserializeUnsigned(bytes)).toThrow(/cannot be null/);
	});

	it("rejects unknown type bytes", () => {
		expect(() => deserializeUnsigned(new Uint8Array([0x05, 0xc0]))).toThrow(
			/Unknown transaction type/,
		);
		expect(() => serializeUnsigned({ ...eip1559, type: 9 } as never)).toThrow(
			/Unknown transaction type: 9/,
		);
	});
});
