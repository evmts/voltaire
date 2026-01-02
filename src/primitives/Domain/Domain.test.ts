import { describe, expect, it } from "vitest";
import * as BrandedAddress from "../Address/internal-index.js";
import * as ChainId from "../ChainId/index.js";
import * as DomainSeparator from "../DomainSeparator/index.js";
import * as Hash from "../Hash/index.js";
import * as Domain from "./index.js";

// Mock keccak256 for testing
function mockKeccak256(data: Uint8Array): Uint8Array {
	// Simple mock - XOR all bytes and repeat
	let hash = 0;
	for (const byte of data) {
		hash ^= byte;
	}
	const result = new Uint8Array(32);
	result.fill(hash);
	return result;
}

describe("Domain", () => {
	describe("from", () => {
		it("should create domain with all fields", () => {
			const domain = Domain.from({
				name: "MyDApp",
				version: "1",
				chainId: 1,
				verifyingContract: "0x0000000000000000000000000000000000000001",
			});

			expect(domain.name).toBe("MyDApp");
			expect(domain.version).toBe("1");
			expect(domain.chainId).toBe(1);
			expect(domain.verifyingContract).toBeDefined();
		});

		it("should create domain with only name", () => {
			const domain = Domain.from({ name: "MyDApp" });
			expect(domain.name).toBe("MyDApp");
			expect(domain.version).toBeUndefined();
		});

		it("should throw on empty domain", () => {
			try {
				Domain.from({});
				expect.fail("Should have thrown");
			} catch (e) {
				expect((e as Error).name).toBe("InvalidDomainError");
				expect((e as Error).message).toContain(
					"Domain must have at least one field defined",
				);
			}
		});

		it("should accept ChainId instance", () => {
			const chainId = ChainId.from(1);
			const domain = Domain.from({ chainId });
			expect(domain.chainId).toBe(chainId);
		});

		it("should accept Address instance", () => {
			const address = BrandedAddress.from(
				"0x0000000000000000000000000000000000000001",
			);
			const domain = Domain.from({ verifyingContract: address });
			expect(domain.verifyingContract).toBe(address);
		});

		it("should accept Hash instance", () => {
			const salt = Hash.from(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			);
			const domain = Domain.from({ salt });
			expect(domain.salt).toBe(salt);
		});
	});

	describe("toHash", () => {
		it("should compute domain separator hash", () => {
			const domain = Domain.from({
				name: "MyDApp",
				version: "1",
				chainId: 1,
			});

			const domainSep = Domain.toHash(domain, { keccak256: mockKeccak256 });
			expect(domainSep.length).toBe(32);
		});

		it("should be deterministic", () => {
			const domain = Domain.from({
				name: "MyDApp",
				version: "1",
			});

			const sep1 = Domain.toHash(domain, { keccak256: mockKeccak256 });
			const sep2 = Domain.toHash(domain, { keccak256: mockKeccak256 });

			expect(DomainSeparator.equals(sep1, sep2)).toBe(true);
		});
	});

	describe("encodeType", () => {
		it("should encode simple type", () => {
			const types = {
				EIP712Domain: [
					{ name: "name", type: "string" },
					{ name: "version", type: "string" },
				],
			};

			const encoded = Domain.encodeType("EIP712Domain", types);
			expect(encoded).toBe("EIP712Domain(string name,string version)");
		});

		it("should encode type with dependencies", () => {
			const types = {
				Mail: [
					{ name: "from", type: "Person" },
					{ name: "to", type: "Person" },
					{ name: "contents", type: "string" },
				],
				Person: [
					{ name: "name", type: "string" },
					{ name: "wallet", type: "address" },
				],
			};

			const encoded = Domain.encodeType("Mail", types);
			// Mail first, then Person (dependency) sorted alphabetically
			expect(encoded).toBe(
				"Mail(Person from,Person to,string contents)Person(string name,address wallet)",
			);
		});
	});

	describe("getEIP712DomainType", () => {
		it("should return type definition for all fields", () => {
			const domain = Domain.from({
				name: "MyDApp",
				version: "1",
				chainId: 1,
				verifyingContract: "0x0000000000000000000000000000000000000001",
			});

			const typeDefinition = Domain.getEIP712DomainType(domain);
			expect(typeDefinition).toEqual([
				{ name: "name", type: "string" },
				{ name: "version", type: "string" },
				{ name: "chainId", type: "uint256" },
				{ name: "verifyingContract", type: "address" },
			]);
		});

		it("should return type definition for partial fields", () => {
			const domain = Domain.from({
				name: "MyDApp",
				chainId: 1,
			});

			const typeDefinition = Domain.getEIP712DomainType(domain);
			expect(typeDefinition).toEqual([
				{ name: "name", type: "string" },
				{ name: "chainId", type: "uint256" },
			]);
		});
	});
});
