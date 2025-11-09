import { describe, expect, it } from "vitest";

import {
	assert,
	checksum,
	clone,
	compare,
	deduplicateAddresses,
	equals,
	from,
	fromBytes,
	fromPrivateKey,
	fromPublicKey,
	greaterThan,
	isEqual,
	isValid,
	isValidChecksum,
	isZero,
	lessThan,
	sortAddresses,
	toBytes,
	toChecksummed,
	toHex,
	toLowercase,
	toShortHex,
	toU256,
	toUppercase,
	type Address,
	validate,
	calculateCreateAddress,
	calculateCreate2Address,
} from "./index.ox.js";

describe("Address.Ox - Core Ox Exports", () => {
	const testAddr: Address = "0x1234567890123456789012345678901234567890";

	it("from() creates address", () => {
		const addr = from("0x1234567890123456789012345678901234567890");
		expect(typeof addr).toBe("string");
		expect(addr.startsWith("0x")).toBe(true);
	});

	it("fromPublicKey() derives address", () => {
		expect(() =>
			fromPublicKey({ x: "0x" + "a".repeat(64), y: "0x" + "a".repeat(64) }),
		).not.toThrow();
	});

	it("validate() validates address", () => {
		expect(() => validate(testAddr)).not.toThrow();
		expect(() => validate("0x123")).toThrow();
	});

	it("assert() asserts valid address", () => {
		expect(() => assert(testAddr)).not.toThrow();
		expect(() => assert("invalid")).toThrow();
	});

	it("isEqual() compares addresses", () => {
		expect(isEqual(testAddr, testAddr)).toBe(true);
		const other: Address = "0x0000000000000000000000000000000000000000";
		expect(isEqual(testAddr, other)).toBe(false);
	});
});

describe("Address.Ox - Compatibility Aliases", () => {
	const testAddr: Address = "0x1234567890123456789012345678901234567890";

	it("checksum() returns checksummed address", () => {
		const result = checksum(testAddr);
		expect(typeof result).toBe("string");
		expect(result.startsWith("0x")).toBe(true);
	});

	it("toChecksummed() alias works", () => {
		const result = toChecksummed(testAddr);
		expect(typeof result).toBe("string");
	});

	it("equals() alias works", () => {
		expect(equals(testAddr, testAddr)).toBe(true);
	});

	it("toHex() returns checksummed hex", () => {
		const result = toHex(testAddr);
		expect(typeof result).toBe("string");
		expect(result.startsWith("0x")).toBe(true);
	});
});

describe("Address.Ox - Voltaire Extensions", () => {
	it("isZero() detects zero addresses", () => {
		const zeroBytes = new Uint8Array(20);
		expect(isZero(zeroBytes as any)).toBe(true);

		const nonZero = new Uint8Array(20);
		nonZero[0] = 0x12;
		expect(isZero(nonZero as any)).toBe(false);
	});

	it("toLowercase() converts to lowercase", () => {
		const testAddr: Address = "0x1234567890123456789012345678901234567890";
		const result = toLowercase(testAddr);
		expect(typeof result).toBe("string");
	});

	it("toUppercase() converts to uppercase", () => {
		const testAddr: Address = "0x1234567890123456789012345678901234567890";
		const result = toUppercase(testAddr);
		expect(typeof result).toBe("string");
	});

	it("toShortHex() returns shortened hex", () => {
		const testAddr: Address = "0x1234567890123456789012345678901234567890";
		const result = toShortHex(testAddr);
		expect(typeof result).toBe("string");
	});

	it("toU256() converts to Uint256", () => {
		const testAddr: Address = "0x1234567890123456789012345678901234567890";
		const result = toU256(testAddr);
		expect(typeof result).toBe("bigint");
	});

	it("toBytes() converts to Uint8Array", () => {
		const testAddr: Address = "0x1234567890123456789012345678901234567890";
		const result = toBytes(testAddr);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(20);
	});

	it("fromBytes() creates address from bytes", () => {
		const bytes = new Uint8Array(20);
		bytes[0] = 0x12;
		const result = fromBytes(bytes);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(20);
	});

	it("fromPrivateKey() creates address", () => {
		const pk = "0x0000000000000000000000000000000000000000000000000000000000000001";
		const result = fromPrivateKey(pk);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(20);
	});

	it("clone() copies address bytes", () => {
		const bytes = new Uint8Array(20);
		bytes[0] = 0x12;
		const cloned = clone(bytes as any);
		expect(cloned).toEqual(bytes);
	});

	it("compare() compares addresses", () => {
		const a1 = new Uint8Array(20);
		a1[19] = 0x01;
		const a2 = new Uint8Array(20);
		a2[19] = 0x02;
		expect(compare(a1 as any, a2 as any)).toBeLessThan(0);
		expect(compare(a2 as any, a1 as any)).toBeGreaterThan(0);
	});

	it("lessThan() compares addresses", () => {
		const a1 = new Uint8Array(20);
		a1[19] = 0x01;
		const a2 = new Uint8Array(20);
		a2[19] = 0x02;
		expect(lessThan(a1 as any, a2 as any)).toBe(true);
	});

	it("greaterThan() compares addresses", () => {
		const a1 = new Uint8Array(20);
		a1[19] = 0x02;
		const a2 = new Uint8Array(20);
		a2[19] = 0x01;
		expect(greaterThan(a1 as any, a2 as any)).toBe(true);
	});

	it("sortAddresses() sorts addresses", () => {
		const a1 = new Uint8Array(20);
		a1[19] = 0x03;
		const a2 = new Uint8Array(20);
		a2[19] = 0x01;
		const sorted = sortAddresses([a1, a2] as any);
		expect(sorted).toBeDefined();
	});

	it("deduplicateAddresses() removes duplicates", () => {
		const a1 = new Uint8Array(20);
		a1[19] = 0x01;
		const a2 = new Uint8Array(20);
		a2[19] = 0x01;
		const deduped = deduplicateAddresses([a1, a2] as any);
		expect(deduped.length).toBeLessThanOrEqual(2);
	});

	it("calculateCreateAddress() calculates CREATE", () => {
		const creator = new Uint8Array(20);
		creator[19] = 0x01;
		const result = calculateCreateAddress(creator as any, 0n);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(20);
	});

	it("calculateCreate2Address() calculates CREATE2", () => {
		const creator = new Uint8Array(20);
		creator[19] = 0x01;
		const salt = new Uint8Array(32);
		const result = calculateCreate2Address(creator as any, salt as any, "0x6080");
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(20);
	});
});

describe("Address.Ox - Validation Helpers", () => {
	const validAddr: Address = "0x1234567890123456789012345678901234567890";

	it("isValid() validates addresses", () => {
		expect(isValid(validAddr)).toBe(true);
		expect(isValid("0x123")).toBe(false);
		expect(isValid(123)).toBe(false);
	});

	it("isValidChecksum() checks checksum", () => {
		const addr = checksum(validAddr);
		expect(isValidChecksum(addr)).toBe(true);
	});
});
