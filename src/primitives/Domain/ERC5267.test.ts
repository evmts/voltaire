import { describe, expect, test } from "vitest";
import { from as addressFrom } from "../Address/from.js";
import * as ChainId from "../ChainId/index.js";
import { Hash } from "../Hash/index.js";
import type { DomainType } from "./DomainType.js";
import { ERC5267_FIELDS } from "./ERC5267Type.js";
import { getFieldsBitmap } from "./getFieldsBitmap.js";
import { toErc5267Response } from "./toErc5267Response.js";

describe("ERC-5267 Domain Response", () => {
	describe("getFieldsBitmap", () => {
		test("all fields present except extensions", () => {
			const domain: DomainType = {
				name: "Test",
				version: "1",
				chainId: ChainId.from(1),
				verifyingContract: addressFrom(
					"0x1234567890123456789012345678901234567890",
				),
				salt: Hash.from(
					"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
				),
			};

			const bitmap = getFieldsBitmap(domain);

			expect(bitmap).toBeInstanceOf(Uint8Array);
			expect(bitmap.length).toBe(1);
			expect(bitmap[0]).toBe(0x1f); // All bits set except extensions (0x20)
		});

		test("minimal domain (only name and version)", () => {
			const domain: DomainType = {
				name: "Test",
				version: "1",
			};

			const bitmap = getFieldsBitmap(domain);

			expect(bitmap[0]).toBe(0x03); // Only NAME (0x01) + VERSION (0x02)
		});

		test("only name", () => {
			const domain: DomainType = {
				name: "Test",
			};

			const bitmap = getFieldsBitmap(domain);

			expect(bitmap[0]).toBe(ERC5267_FIELDS.NAME);
		});

		test("only version", () => {
			const domain: DomainType = {
				version: "1.0.0",
			};

			const bitmap = getFieldsBitmap(domain);

			expect(bitmap[0]).toBe(ERC5267_FIELDS.VERSION);
		});

		test("only chainId", () => {
			const domain: DomainType = {
				chainId: ChainId.from(1),
			};

			const bitmap = getFieldsBitmap(domain);

			expect(bitmap[0]).toBe(ERC5267_FIELDS.CHAIN_ID);
		});

		test("only verifyingContract", () => {
			const domain: DomainType = {
				verifyingContract: addressFrom(
					"0x1234567890123456789012345678901234567890",
				),
			};

			const bitmap = getFieldsBitmap(domain);

			expect(bitmap[0]).toBe(ERC5267_FIELDS.VERIFYING_CONTRACT);
		});

		test("only salt", () => {
			const domain: DomainType = {
				salt: Hash.from(
					"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
				),
			};

			const bitmap = getFieldsBitmap(domain);

			expect(bitmap[0]).toBe(ERC5267_FIELDS.SALT);
		});

		test("chainId + verifyingContract (common case)", () => {
			const domain: DomainType = {
				chainId: ChainId.from(1),
				verifyingContract: addressFrom(
					"0x1234567890123456789012345678901234567890",
				),
			};

			const bitmap = getFieldsBitmap(domain);

			expect(bitmap[0]).toBe(
				ERC5267_FIELDS.CHAIN_ID | ERC5267_FIELDS.VERIFYING_CONTRACT,
			);
		});
	});

	describe("toErc5267Response", () => {
		test("full domain", () => {
			const domain: DomainType = {
				name: "MyContract",
				version: "1.0.0",
				chainId: ChainId.from(1),
				verifyingContract: addressFrom(
					"0x1234567890123456789012345678901234567890",
				),
				salt: Hash.from(
					"0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd",
				),
			};

			const response = toErc5267Response(domain);

			expect(response.fields[0]).toBe(0x1f); // All fields except extensions
			expect(response.name).toBe("MyContract");
			expect(response.version).toBe("1.0.0");
			expect(response.chainId).toBe(1n);
			expect(response.verifyingContract).toBe(domain.verifyingContract);
			expect(response.salt).toBe(domain.salt);
			expect(response.extensions).toEqual([]);
		});

		test("minimal domain (only name)", () => {
			const domain: DomainType = {
				name: "Test",
			};

			const response = toErc5267Response(domain);

			expect(response.fields[0]).toBe(0x01); // Only name bit
			expect(response.name).toBe("Test");
			expect(response.version).toBe("");
			expect(response.chainId).toBe(0n);
			expect(response.verifyingContract).toEqual(
				addressFrom("0x0000000000000000000000000000000000000000"),
			);
			expect(response.salt).toEqual(new Uint8Array(32));
			expect(response.extensions).toEqual([]);
		});

		test("domain with name and version", () => {
			const domain: DomainType = {
				name: "MyApp",
				version: "2.0.0",
			};

			const response = toErc5267Response(domain);

			expect(response.fields[0]).toBe(0x03); // name + version
			expect(response.name).toBe("MyApp");
			expect(response.version).toBe("2.0.0");
			expect(response.chainId).toBe(0n);
		});

		test("domain with chainId and verifyingContract", () => {
			const domain: DomainType = {
				chainId: ChainId.from(137),
				verifyingContract: addressFrom(
					"0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd",
				),
			};

			const response = toErc5267Response(domain);

			expect(response.fields[0]).toBe(0x0c); // chainId + verifyingContract
			expect(response.name).toBe("");
			expect(response.version).toBe("");
			expect(response.chainId).toBe(137n);
			expect(response.verifyingContract).toBe(domain.verifyingContract);
		});

		test("domain with only salt", () => {
			const salt = Hash.from(
				"0x1111111111111111111111111111111111111111111111111111111111111111",
			);
			const domain: DomainType = {
				salt,
			};

			const response = toErc5267Response(domain);

			expect(response.fields[0]).toBe(0x10); // Only salt bit
			expect(response.name).toBe("");
			expect(response.version).toBe("");
			expect(response.chainId).toBe(0n);
			expect(response.salt).toBe(salt);
		});

		test("extensions always empty array", () => {
			const domain: DomainType = {
				name: "Test",
			};

			const response = toErc5267Response(domain);

			expect(response.extensions).toEqual([]);
			expect(Array.isArray(response.extensions)).toBe(true);
			expect(response.extensions.length).toBe(0);
		});

		test("default salt is 32 zero bytes", () => {
			const domain: DomainType = {
				name: "Test",
			};

			const response = toErc5267Response(domain);

			expect(response.salt).toEqual(new Uint8Array(32));
			expect(response.salt.length).toBe(32);
			expect(response.salt.every((byte) => byte === 0)).toBe(true);
		});

		test("default verifyingContract is zero address", () => {
			const domain: DomainType = {
				name: "Test",
			};

			const response = toErc5267Response(domain);

			const zeroAddress = addressFrom(
				"0x0000000000000000000000000000000000000000",
			);
			expect(response.verifyingContract).toEqual(zeroAddress);
		});

		test("real-world example: Uniswap-style domain", () => {
			const domain: DomainType = {
				name: "Uniswap V2",
				version: "1",
				chainId: ChainId.from(1),
				verifyingContract: addressFrom(
					"0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
				),
			};

			const response = toErc5267Response(domain);

			expect(response.fields[0]).toBe(0x0f); // name + version + chainId + verifyingContract
			expect(response.name).toBe("Uniswap V2");
			expect(response.version).toBe("1");
			expect(response.chainId).toBe(1n);
			expect(response.verifyingContract).toBe(domain.verifyingContract);
			expect(response.salt).toEqual(new Uint8Array(32));
			expect(response.extensions).toEqual([]);
		});
	});

	describe("ERC5267_FIELDS constants", () => {
		test("field values match ERC-5267 spec", () => {
			expect(ERC5267_FIELDS.NAME).toBe(0x01);
			expect(ERC5267_FIELDS.VERSION).toBe(0x02);
			expect(ERC5267_FIELDS.CHAIN_ID).toBe(0x04);
			expect(ERC5267_FIELDS.VERIFYING_CONTRACT).toBe(0x08);
			expect(ERC5267_FIELDS.SALT).toBe(0x10);
			expect(ERC5267_FIELDS.EXTENSIONS).toBe(0x20);
		});

		test("fields are powers of 2 (single bit each)", () => {
			const fields = [
				ERC5267_FIELDS.NAME,
				ERC5267_FIELDS.VERSION,
				ERC5267_FIELDS.CHAIN_ID,
				ERC5267_FIELDS.VERIFYING_CONTRACT,
				ERC5267_FIELDS.SALT,
				ERC5267_FIELDS.EXTENSIONS,
			];

			for (const field of fields) {
				// Each field should have exactly one bit set (power of 2)
				expect((field & (field - 1)) === 0 && field !== 0).toBe(true);
			}
		});
	});
});
