import { hash as keccak256 } from "@tevm/voltaire/Keccak256";
import * as Schema from "effect/Schema";
import { describe, expect, it } from "@effect/vitest";
import * as Domain from "./index.js";

describe("Domain.Struct", () => {
	describe("decode", () => {
		it("decodes valid domain object", () => {
			const input = {
				name: "MyDApp",
				version: "1",
				chainId: 1n,
			};
			const result = Schema.decodeSync(Domain.Struct)(input);
			expect(result.name).toBe("MyDApp");
			expect(result.version).toBe("1");
		});

		it("decodes with verifying contract", () => {
			const input = {
				name: "MyDApp",
				version: "1",
				chainId: 1n,
				verifyingContract: `0x${"00".repeat(20)}`,
			};
			const result = Schema.decodeSync(Domain.Struct)(input);
			expect(result.name).toBe("MyDApp");
		});
	});

	describe("encode", () => {
		it("encodes back to input format", () => {
			const input = {
				name: "MyDApp",
				version: "1",
				chainId: 1n,
			};
			const domain = Schema.decodeSync(Domain.Struct)(input);
			const encoded = Schema.encodeSync(Domain.Struct)(domain);
			expect(encoded.name).toBe("MyDApp");
			expect(encoded.version).toBe("1");
		});
	});
});

describe("pure functions", () => {
	it("toHash computes domain separator hash", () => {
		const input = {
			name: "MyDApp",
			version: "1",
			chainId: 1n,
		};
		const domain = Schema.decodeSync(Domain.Struct)(input);
		const hash = Domain.toHash(domain, { keccak256 });
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});

	it("getEIP712DomainType returns domain type fields", () => {
		const input = {
			name: "MyDApp",
			version: "1",
			chainId: 1n,
		};
		const domain = Schema.decodeSync(Domain.Struct)(input);
		const fields = Domain.getEIP712DomainType(domain);
		expect(Array.isArray(fields)).toBe(true);
		expect(fields.some((f) => f.name === "name")).toBe(true);
	});

	it("getFieldsBitmap returns bitmap of present fields", () => {
		const input = {
			name: "MyDApp",
			version: "1",
		};
		const domain = Schema.decodeSync(Domain.Struct)(input);
		const bitmap = Domain.getFieldsBitmap(domain);
		expect(bitmap).toBeInstanceOf(Uint8Array);
	});
});
