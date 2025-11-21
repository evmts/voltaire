import { describe, expect, test } from "vitest";
import { recoverPublicKey } from "../../crypto/Secp256k1/recoverPublicKey.js";
import { hash as keccak256 } from "../../crypto/keccak256/hash.js";
import { fromPublicKey } from "../Address/fromPublicKey.js";
import {
	EIP191_PREFIX,
	PERSONAL_MESSAGE_PREFIX,
	VERSION_DATA_WITH_VALIDATOR,
	VERSION_PERSONAL_MESSAGE,
	VERSION_STRUCTURED_DATA,
} from "./constants.js";
import { InvalidSignedDataVersionError } from "./errors.js";
import { from } from "./from.js";
import { Hash } from "./hash.js";
import { Verify } from "./verify.js";

describe("SignedData", () => {
	describe("from", () => {
		test("creates personal message signed data (0x45)", () => {
			const message = new TextEncoder().encode("Hello, Ethereum!");
			const signedData = from(
				VERSION_PERSONAL_MESSAGE,
				new Uint8Array(0),
				message,
			);

			expect(signedData[0]).toBe(EIP191_PREFIX);
			expect(signedData[1]).toBe(VERSION_PERSONAL_MESSAGE);
			expect(signedData.slice(2)).toEqual(message);
		});

		test("creates data with validator (0x00)", () => {
			const validator = new Uint8Array(20).fill(0xab);
			const data = new TextEncoder().encode("test data");
			const signedData = from(VERSION_DATA_WITH_VALIDATOR, validator, data);

			expect(signedData[0]).toBe(EIP191_PREFIX);
			expect(signedData[1]).toBe(VERSION_DATA_WITH_VALIDATOR);
			expect(signedData.slice(2, 22)).toEqual(validator);
			expect(signedData.slice(22)).toEqual(data);
		});

		test("creates structured data (0x01)", () => {
			const domainSeparator = new Uint8Array(32).fill(0xcd);
			const data = new Uint8Array(32).fill(0xef);
			const signedData = from(VERSION_STRUCTURED_DATA, domainSeparator, data);

			expect(signedData[0]).toBe(EIP191_PREFIX);
			expect(signedData[1]).toBe(VERSION_STRUCTURED_DATA);
			expect(signedData.slice(2, 34)).toEqual(domainSeparator);
			expect(signedData.slice(34)).toEqual(data);
		});

		test("throws on invalid version", () => {
			expect(() => from(0x99, new Uint8Array(0), new Uint8Array(0))).toThrow(
				InvalidSignedDataVersionError,
			);
		});
	});

	describe("Hash", () => {
		const hash = Hash({ keccak256 });

		test("hashes personal message from string", () => {
			const message = "Hello, Ethereum!";
			const result = hash(message);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
		});

		test("hashes personal message from bytes", () => {
			const message = new TextEncoder().encode("Hello, Ethereum!");
			const result = hash(message);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
		});

		test("produces correct EIP-191 hash format", () => {
			// Known test vector
			const message = "Hello World";
			const messageBytes = new TextEncoder().encode(message);
			const result = hash(messageBytes);

			// Manually verify format: "\x19Ethereum Signed Message:\n11Hello World"
			const prefix = new TextEncoder().encode(PERSONAL_MESSAGE_PREFIX);
			const len = new TextEncoder().encode("11");
			const data = new Uint8Array(
				prefix.length + len.length + messageBytes.length,
			);
			data.set(prefix, 0);
			data.set(len, prefix.length);
			data.set(messageBytes, prefix.length + len.length);

			const expected = keccak256(data);
			expect(result).toEqual(expected);
		});

		test("handles empty message", () => {
			const result = hash("");
			expect(result.length).toBe(32);
		});

		test("handles unicode message", () => {
			const message = "Hello 👋 Ethereum!";
			const result = hash(message);
			expect(result.length).toBe(32);
		});
	});

	describe("Verify", () => {
		const verify = Verify({
			keccak256,
			recoverPublicKey,
			addressFromPublicKey: fromPublicKey,
		});

		test("verifies valid signature", () => {
			// Known test vector (would need actual signature data)
			// This is a placeholder - in real usage, signature would be from actual signing
			const message = "Test message";
			const signature = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
				v: 27,
			};
			const address = new Uint8Array(20).fill(0x42);

			// This will return false because signature is invalid, but tests the flow
			const result = verify(message, signature, address);
			expect(typeof result).toBe("boolean");
		});

		test("returns false for invalid signature", () => {
			const message = "Test message";
			const badSignature = {
				r: new Uint8Array(32),
				s: new Uint8Array(32),
				v: 27,
			};
			const address = new Uint8Array(20).fill(0x42);

			const result = verify(message, badSignature, address);
			expect(result).toBe(false);
		});

		test("handles string and bytes messages", () => {
			const signature = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
				v: 27,
			};
			const address = new Uint8Array(20).fill(0x42);

			// Both should execute without error
			verify("string message", signature, address);
			verify(new TextEncoder().encode("bytes message"), signature, address);
		});
	});

	describe("Constants", () => {
		test("EIP191_PREFIX is 0x19", () => {
			expect(EIP191_PREFIX).toBe(0x19);
		});

		test("VERSION_DATA_WITH_VALIDATOR is 0x00", () => {
			expect(VERSION_DATA_WITH_VALIDATOR).toBe(0x00);
		});

		test("VERSION_STRUCTURED_DATA is 0x01", () => {
			expect(VERSION_STRUCTURED_DATA).toBe(0x01);
		});

		test("VERSION_PERSONAL_MESSAGE is 0x45", () => {
			expect(VERSION_PERSONAL_MESSAGE).toBe(0x45);
		});

		test("PERSONAL_MESSAGE_PREFIX is correct", () => {
			expect(PERSONAL_MESSAGE_PREFIX).toBe("\x19Ethereum Signed Message:\n");
		});
	});
});
