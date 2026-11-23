import { keccak256, serializeTransaction } from "viem";
import { describe, expect, it } from "vitest";
import * as Secp256k1 from "../../crypto/Secp256k1/index.js";
import { PrivateKey } from "../../crypto/Secp256k1/index.js";
import { Address } from "../Address/index.js";
import { Hash } from "../Hash/index.js";
import { fromBytes as hexFromBytes } from "../Hex/fromBytes.js";
import { deserializeUnsigned } from "./deserializeUnsigned.js";
import { deserialize as deserialize1559 } from "./EIP1559/deserialize.js";
import { serialize as serialize1559 } from "./EIP1559/serialize.js";
import { deserialize as deserialize2930 } from "./EIP2930/deserialize.js";
import { serialize as serialize2930 } from "./EIP2930/serialize.js";
import { deserialize as deserialize4844 } from "./EIP4844/deserialize.js";
import { serialize as serialize4844 } from "./EIP4844/serialize.js";
import { deserialize as deserialize7702 } from "./EIP7702/deserialize.js";
import { getSigningHash as signingHash7702 } from "./EIP7702/getSigningHash.js";
import { serialize as serialize7702 } from "./EIP7702/serialize.js";
import { deserialize as deserializeLegacy } from "./Legacy/deserialize.js";
import { getSender as getSenderLegacy } from "./Legacy/getSender.js";
import { getSigningHash as signingHashLegacy } from "./Legacy/getSigningHash.js";
import { hash as hashLegacy } from "./Legacy/hash.js";
import { serialize as serializeLegacy } from "./Legacy/serialize.js";
import type { TransactionLegacyType } from "./Legacy/TransactionLegacyType.js";
import { serializeUnsigned } from "./serializeUnsigned.js";
import { Type } from "./types.js";
import {
	decodeSignatureScalar,
	encodeSignatureScalar,
	encodeYParity,
} from "./utils.js";

// viem is the reference encoder: it emits canonical RLP integers.

const TO = "0x742d35cc6634c0532925a3b844bc9e7595f0beb0" as const;
const AUTH_ADDR = "0x1111111111111111111111111111111111111111" as const;

/** 32-byte scalar with a leading zero byte (31 significant bytes). */
const R = new Uint8Array(32).fill(0x11);
R[0] = 0;
const S = new Uint8Array(32).fill(0x22);
const rHex = hexFromBytes(R) as `0x${string}`;
const sHex = hexFromBytes(S) as `0x${string}`;

const hex = (b: Uint8Array) => hexFromBytes(b) as string;

describe("canonical RLP signature fields", () => {
	it("encodes yParity 0 as the empty string and strips scalar zeros", () => {
		expect(encodeYParity(0)).toEqual(new Uint8Array(0));
		expect(encodeYParity(1)).toEqual(new Uint8Array([1]));
		expect(encodeSignatureScalar(R)).toEqual(R.slice(1));
		expect(encodeSignatureScalar(new Uint8Array(32))).toEqual(
			new Uint8Array(0),
		);
	});

	it("pads decoded scalars to 32 bytes and rejects > 32 bytes", () => {
		expect(decodeSignatureScalar(R.slice(1))).toEqual(R);
		expect(decodeSignatureScalar(new Uint8Array(0))).toEqual(
			new Uint8Array(32),
		);
		expect(() => decodeSignatureScalar(new Uint8Array(33))).toThrow(
			"Invalid signature scalar length",
		);
	});

	it("rejects scalars with a leading zero byte", () => {
		expect(() => decodeSignatureScalar(R)).toThrow("leading zero");
		expect(() => decodeSignatureScalar(new Uint8Array([0]))).toThrow(
			"leading zero",
		);
		expect(() => decodeSignatureScalar(new Uint8Array([0, 1]))).toThrow(
			"leading zero",
		);
	});

	describe("Legacy", () => {
		const legacy = (overrides: Partial<TransactionLegacyType> = {}) =>
			({
				__tag: "TransactionLegacy",
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 2n,
				gasLimit: 21000n,
				to: Address(TO),
				value: 0n,
				data: new Uint8Array(),
				v: 37n,
				r: R,
				s: S,
				...overrides,
			}) as TransactionLegacyType;

		const viemLegacy = (tx: TransactionLegacyType) =>
			serializeTransaction(
				{
					type: "legacy",
					chainId: 1,
					nonce: Number(tx.nonce),
					gasPrice: tx.gasPrice,
					gas: tx.gasLimit,
					to: TO,
					value: tx.value,
					data: "0x",
				},
				{
					r: hexFromBytes(tx.r) as `0x${string}`,
					s: hexFromBytes(tx.s) as `0x${string}`,
					v: tx.v,
				},
			);

		it("wire bytes match viem and round-trip with a leading-zero r", () => {
			const tx = legacy();
			const bytes = serializeLegacy.call(tx);
			expect(hex(bytes)).toBe(viemLegacy(tx));
			// r is 0x9f + 31 bytes, not 0xa0 + 32 bytes with a zero prefix.
			expect(hex(bytes)).toContain(
				`259f${"11".repeat(31)}a0${"22".repeat(32)}`,
			);
			const back = deserializeLegacy(bytes);
			expect(back.r).toEqual(R);
			expect(back.s).toEqual(S);
			expect(serializeLegacy.call(back)).toEqual(bytes);
		});

		it("strips leading zeros from s and from short/zero scalars", () => {
			const s = new Uint8Array(32).fill(0x33);
			s[0] = 0;
			s[1] = 0;
			const tx = legacy({ r: new Uint8Array(32).fill(0x44), s });
			const bytes = serializeLegacy.call(tx);
			expect(hex(bytes)).toBe(viemLegacy(tx));
			expect(hex(bytes).endsWith(`9e${"33".repeat(30)}`)).toBe(true);
			const back = deserializeLegacy(bytes);
			expect(back.s).toEqual(s);
			expect(serializeLegacy.call(back)).toEqual(bytes);
		});

		it("rejects 32-byte r or s with a leading zero byte on the wire", () => {
			const canonical = serializeLegacy.call(legacy());
			// Rebuild with r as a 32-byte string (0xa0 + 00 + 31 bytes).
			const marker = `9f${"11".repeat(31)}`;
			const padded = hex(canonical).replace(marker, `a000${"11".repeat(31)}`);
			expect(padded).not.toBe(hex(canonical));
			const body = padded.slice(2 + 4); // drop 0x and the f8 LL list header
			const bytes = Uint8Array.from(
				[0xf8, body.length / 2].concat(
					Array.from({ length: body.length / 2 }, (_, i) =>
						Number.parseInt(body.slice(i * 2, i * 2 + 2), 16),
					),
				),
			);
			expect(() => deserializeLegacy(bytes)).toThrow("leading zero");
		});

		/**
		 * Signs legacy transactions with increasing nonces until the wanted
		 * scalar has a leading zero byte (1 in 256 for r, 1 in 128 for low s).
		 * RFC 6979 signing makes the search deterministic.
		 */
		const signWithLeadingZero = (scalar: "r" | "s") => {
			const privateKey = PrivateKey.from(
				"0x0123456789012345678901234567890123456789012345678901234567890123",
			);
			const sender = Address.fromPublicKey(
				Secp256k1.derivePublicKey(privateKey),
			);
			for (let nonce = 0n; nonce < 20000n; nonce++) {
				const unsigned = legacy({
					nonce,
					v: 37n, // EIP-155, chainId 1
					r: new Uint8Array(32),
					s: new Uint8Array(32),
				});
				const signature = Secp256k1.sign(
					signingHashLegacy.call(unsigned),
					privateKey,
				);
				if (signature[scalar][0] !== 0) continue;
				const signed = legacy({
					nonce,
					v: BigInt(signature.v - 27) + 37n,
					r: signature.r,
					s: signature.s,
				});
				return { signed, sender };
			}
			throw new Error(`no signature with a leading-zero ${scalar} found`);
		};

		for (const scalar of ["r", "s"] as const) {
			it(`getSender and hash survive a round-trip with a leading-zero ${scalar}`, () => {
				const { signed, sender } = signWithLeadingZero(scalar);
				expect(signed[scalar][0]).toBe(0);
				expect(Address.toHex(getSenderLegacy.call(signed))).toBe(
					Address.toHex(sender),
				);

				const bytes = serializeLegacy.call(signed);
				expect(hex(bytes)).toBe(viemLegacy(signed));
				expect(hex(hashLegacy.call(signed))).toBe(
					keccak256(viemLegacy(signed)),
				);

				const back = deserializeLegacy(bytes);
				expect(hex(back.r)).toBe(hex(signed.r));
				expect(hex(back.s)).toBe(hex(signed.s));
				expect(back.r.length).toBe(32);
				expect(back.s.length).toBe(32);
				expect(Address.toHex(getSenderLegacy.call(back))).toBe(
					Address.toHex(sender),
				);
				expect(hashLegacy.call(back)).toEqual(hashLegacy.call(signed));
				expect(serializeLegacy.call(back)).toEqual(bytes);
			});
		}
	});

	it("EIP-2930 wire bytes match viem and round-trip", () => {
		const tx = {
			type: Type.EIP2930,
			chainId: 1n,
			nonce: 0n,
			gasPrice: 2n,
			gasLimit: 21000n,
			to: Address(TO),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: R,
			s: S,
		} as unknown as Parameters<typeof serialize2930>[0];
		const bytes = serialize2930(tx);
		expect(hex(bytes)).toBe(
			serializeTransaction(
				{
					type: "eip2930",
					chainId: 1,
					nonce: 0,
					gasPrice: 2n,
					gas: 21000n,
					to: TO,
					value: 0n,
					data: "0x",
					accessList: [],
				},
				{ r: rHex, s: sHex, yParity: 0 },
			),
		);
		const back = deserialize2930(bytes);
		expect(back.yParity).toBe(0);
		expect(back.r).toEqual(R);
		expect(back.s).toEqual(S);
	});

	it("EIP-1559 wire bytes match viem and round-trip", () => {
		const tx = {
			type: Type.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1n,
			maxFeePerGas: 2n,
			gasLimit: 21000n,
			to: Address(TO),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: R,
			s: S,
		} as unknown as Parameters<typeof serialize1559>[0];
		const bytes = serialize1559(tx);
		const expected = serializeTransaction(
			{
				type: "eip1559",
				chainId: 1,
				nonce: 0,
				maxPriorityFeePerGas: 1n,
				maxFeePerGas: 2n,
				gas: 21000n,
				to: TO,
				value: 0n,
				data: "0x",
			},
			{ r: rHex, s: sHex, yParity: 0 },
		);
		expect(hex(bytes)).toBe(expected);
		// yParity 0 is 0x80, r is 0x9f + 31 bytes.
		expect(expected).toContain(`c0809f${"11".repeat(31)}`);
		const back = deserialize1559(bytes);
		expect(back.yParity).toBe(0);
		expect(back.r).toEqual(R);
		expect(back.s).toEqual(S);
		expect(serialize1559(back)).toEqual(bytes);
	});

	it("EIP-4844 wire bytes match viem and round-trip", () => {
		const blobHash = `0x01${"ab".repeat(31)}` as const;
		const tx = {
			type: Type.EIP4844,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1n,
			maxFeePerGas: 2n,
			gasLimit: 21000n,
			to: Address(TO),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			maxFeePerBlobGas: 3n,
			blobVersionedHashes: [Hash(blobHash)],
			yParity: 0,
			r: R,
			s: S,
		} as unknown as Parameters<typeof serialize4844>[0];
		const bytes = serialize4844(tx);
		expect(hex(bytes)).toBe(
			serializeTransaction(
				{
					type: "eip4844",
					chainId: 1,
					nonce: 0,
					maxPriorityFeePerGas: 1n,
					maxFeePerGas: 2n,
					gas: 21000n,
					to: TO,
					value: 0n,
					data: "0x",
					maxFeePerBlobGas: 3n,
					blobVersionedHashes: [blobHash],
				},
				{ r: rHex, s: sHex, yParity: 0 },
			),
		);
		const back = deserialize4844(bytes);
		expect(back.yParity).toBe(0);
		expect(back.r).toEqual(R);
		expect(back.s).toEqual(S);
	});

	describe("EIP-7702", () => {
		const auth = {
			chainId: 1n,
			address: Address(AUTH_ADDR),
			nonce: 0n,
			yParity: 0,
			r: R,
			s: S,
		};
		const tx = {
			type: Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1n,
			maxFeePerGas: 2n,
			gasLimit: 100000n,
			to: Address(TO),
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [auth],
			yParity: 0,
			r: R,
			s: S,
		} as unknown as Parameters<typeof serialize7702>[0];
		const viemTx = {
			type: "eip7702",
			chainId: 1,
			nonce: 0,
			maxPriorityFeePerGas: 1n,
			maxFeePerGas: 2n,
			gas: 100000n,
			to: TO,
			value: 0n,
			data: "0x",
			authorizationList: [
				{
					address: AUTH_ADDR,
					chainId: 1,
					nonce: 0,
					r: rHex,
					s: sHex,
					yParity: 0,
				},
			],
		} as const;

		it("wire bytes match viem (outer + authorization signatures)", () => {
			expect(hex(serialize7702(tx))).toBe(
				serializeTransaction(viemTx, { r: rHex, s: sHex, yParity: 0 }),
			);
		});

		it("signing hash matches viem", () => {
			expect(hex(signingHash7702(tx))).toBe(
				keccak256(serializeTransaction(viemTx)),
			);
		});

		it("serializeUnsigned matches viem and deserializeUnsigned accepts minimal authorization integers", () => {
			const unsigned = serializeUnsigned(tx);
			expect(hex(unsigned)).toBe(serializeTransaction(viemTx));
			const back = deserializeUnsigned(unsigned);
			if (back.type !== Type.EIP7702) throw new Error("expected EIP-7702");
			expect(back.authorizationList[0]?.yParity).toBe(0);
			expect(back.authorizationList[0]?.r).toEqual(R);
			expect(back.authorizationList[0]?.s).toEqual(S);
		});

		it("deserialize pads outer and authorization scalars to 32 bytes", () => {
			const back = deserialize7702(serialize7702(tx));
			expect(back.yParity).toBe(0);
			expect(back.r).toEqual(R);
			expect(back.s).toEqual(S);
			expect(back.authorizationList[0]?.yParity).toBe(0);
			expect(back.authorizationList[0]?.r).toEqual(R);
			expect(back.authorizationList[0]?.s).toEqual(S);
		});
	});
});
